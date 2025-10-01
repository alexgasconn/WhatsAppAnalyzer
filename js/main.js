let chartInstances = [];
let originalRawData = null; // Store the raw parsed data before any filtering
let globalData = null;      // Store the currently displayed (filtered) data
let gameState = {
  currentQuestion: 0,
  score: 0,
  answered: false,
  questions: []
};
let currentActiveTab = 'overview'; // Keep track of the currently active tab

document.addEventListener('DOMContentLoaded', () => {
  // Event listener for file input
  document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('fileName').textContent = `Selected: ${file.name}`;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        parseChatFile(e.target.result);
        document.getElementById('dateFilterSection').style.display = 'flex'; // Show filter after upload
      } catch (error) {
        showError('Error analyzing chat: ' + error.message);
      }
    };
    reader.readAsText(file);
  });

  // Event listeners for tab buttons
  document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', (event) => {
      currentActiveTab = event.target.dataset.tab; // Update active tab tracker
      showTab(currentActiveTab);
    });
  });

  // Event listeners for date filters
  document.getElementById('applyDateFilter').addEventListener('click', applyDateFilter);
  document.getElementById('clearDateFilter').addEventListener('click', clearDateFilter);

  // Show the overview tab by default
  showTab('overview');
});

/**
 * Shows the specified tab and hides others.
 * @param {string} tabName The ID of the tab content div to show.
 */
function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(div => div.style.display = 'none');
  const activeTabContent = document.getElementById(tabName);
  if (activeTabContent) {
    activeTabContent.style.display = 'block';
  }
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeTabButton = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (activeTabButton) {
    activeTabButton.classList.add('active');
  }

  // If data is loaded, re-render the active tab
  if (globalData) {
    destroyCharts(); // Clear charts from previous tab views
    // Special handling for content tab's wordcloud as it needs its container visible
    if (tabName === 'content') {
        setTimeout(() => { // Give browser a moment to render the div before WordCloud tries to access it
            generateContent(globalData);
        }, 100);
    } else {
        renderTabContent(tabName, globalData);
    }
  }
}

/**
 * Renders the content for a specific tab.
 * This function is called after data is loaded/filtered and a tab is selected.
 * @param {string} tabName The ID of the tab content div.
 * @param {Array} data The data to use for rendering.
 */
function renderTabContent(tabName, data) {
    switch (tabName) {
      case 'overview': generateOverview(data); break;
      case 'activity': generateActivity(data); break;
      case 'users': generateUsers(data); break;
      case 'relationships': generateRelationships(data); break;
      case 'predictions': generatePredictions(data); break;
      case 'game': initializeGame(data); break;
      case 'content': generateContent(data); break; // Already handled by setTimeout above for WordCloud
    }
}


/**
 * Parses the raw chat text and extracts messages.
 * @param {string} text The raw chat file content.
 */
function parseChatFile(text) {
  destroyCharts();

  const lines = text.split('\n');
  const pattern = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s(\d{1,2}:\d{2})\s-\s([^:]+):\s(.*)$/;
  const data = [];

  let currentMessage = null;

  lines.forEach(line => {
    const match = line.match(pattern);
    if (match) {
      if (currentMessage) {
        data.push(currentMessage);
      }
      const [_, date, time, user, message] = match;
      const parts = date.split('/');
      // Note: JavaScript Date month is 0-indexed (Jan=0, Dec=11)
      const dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      const [hours, minutes] = time.split(':').map(Number);
      dateObj.setHours(hours, minutes, 0, 0);
      currentMessage = { datetime: dateObj, user: user.trim(), message: message.trim() };
    } else if (currentMessage) {
      // This line is a continuation of the previous message
      currentMessage.message += '\n' + line.trim();
    }
  });

  if (currentMessage) {
    data.push(currentMessage);
  }

  if (data.length === 0) {
    showError('No messages found. Please check your file format. Ensure it matches "DD/MM/YYYY, HH:MM - User: Message"');
    return;
  }

  originalRawData = data; // Store raw data
  globalData = data;       // Initially, globalData is the raw data

  // Set default filter dates based on data
  const minDate = new Date(Math.min(...data.map(d => d.datetime)));
  const maxDate = new Date(Math.max(...data.map(d => d.datetime)));
  document.getElementById('startDate').valueAsDate = minDate;
  document.getElementById('endDate').valueAsDate = maxDate;

  // Automatically render the active tab with new data
  showTab(currentActiveTab);
}

/**
 * Applies the date filter to the chat data.
 */
function applyDateFilter() {
  if (!originalRawData) return;

  const startDateInput = document.getElementById('startDate').valueAsDate;
  const endDateInput = document.getElementById('endDate').valueAsDate;

  if (!startDateInput || !endDateInput) {
    alert("Please select both start and end dates.");
    return;
  }

  // Normalize dates to start/end of day for accurate filtering
  const filterStartDate = new Date(startDateInput.setHours(0, 0, 0, 0));
  const filterEndDate = new Date(endDateInput.setHours(23, 59, 59, 999));

  const filteredData = originalRawData.filter(d => {
    return d.datetime >= filterStartDate && d.datetime <= filterEndDate;
  });

  if (filteredData.length === 0) {
    showError('No messages found for the selected date range.');
    globalData = []; // Clear global data if no messages
  } else {
    globalData = filteredData;
    showTab(currentActiveTab); // Re-render the current tab with filtered data
  }
}

/**
 * Clears the date filter and reloads all original data.
 */
function clearDateFilter() {
  if (!originalRawData) return;

  // Reset date inputs to min/max dates from original data
  const minDate = new Date(Math.min(...originalRawData.map(d => d.datetime)));
  const maxDate = new Date(Math.max(...originalRawData.map(d => d.datetime)));
  document.getElementById('startDate').valueAsDate = minDate;
  document.getElementById('endDate').valueAsDate = maxDate;

  globalData = originalRawData; // Restore original data
  showTab(currentActiveTab);    // Re-render the current tab with original data
}


/**
 * Displays an error message in the overview content area.
 * @param {string} message The error message to display.
 */
function showError(message) {
  document.getElementById('overviewContent').innerHTML = 
    `<div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 10px; margin: 20px; border: 1px solid #f5c6cb;"><strong>Error:</strong> ${message}</div>`;
}

/**
 * Destroys all existing Chart.js instances to prevent memory leaks and conflicts.
 */
function destroyCharts() {
  chartInstances.forEach(chart => chart.destroy());
  chartInstances = [];
}

/**
 * Shuffles an array (Fisher-Yates algorithm).
 * @param {Array} array The array to shuffle.
 * @returns {Array} The shuffled array.
 */
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}