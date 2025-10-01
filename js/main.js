let chartInstances = [];
let globalData = null; // Store parsed chat data globally
let gameState = { // Initial state for the game
  currentQuestion: 0,
  score: 0,
  answered: false,
  questions: []
};

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
      } catch (error) {
        showError('Error analyzing chat: ' + error.message);
      }
    };
    reader.readAsText(file);
  });

  // Event listeners for tab buttons
  document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', (event) => {
      const tabName = event.target.dataset.tab;
      showTab(tabName);
    });
  });

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
    switch (tabName) {
      case 'overview': generateOverview(globalData); break;
      case 'activity': generateActivity(globalData); break;
      case 'users': generateUsers(globalData); break;
      case 'relationships': generateRelationships(globalData); break;
      case 'predictions': generatePredictions(globalData); break;
      case 'game': initializeGame(globalData); break; // Renamed to initializeGame
      case 'content': generateContent(globalData); break;
    }
  }
}

/**
 * Parses the raw chat text and extracts messages.
 * @param {string} text The raw chat file content.
 */
function parseChatFile(text) {
  destroyCharts(); // Clear any existing charts

  const lines = text.split('\n');
  // Updated regex to handle optional comma after date, and consistent space before hyphen
  const pattern = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s(\d{1,2}:\d{2})\s-\s([^:]+):\s(.*)$/;
  const data = [];

  let currentMessage = null; // To handle multi-line messages

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
      dateObj.setHours(hours, minutes, 0, 0); // Set hours, minutes, seconds, milliseconds
      currentMessage = { datetime: dateObj, user: user.trim(), message: message.trim() };
    } else if (currentMessage) {
      // This line is a continuation of the previous message
      currentMessage.message += '\n' + line.trim();
    }
  });

  // Push the last message if it exists
  if (currentMessage) {
    data.push(currentMessage);
  }

  if (data.length === 0) {
    showError('No messages found. Please check your file format. Ensure it matches "DD/MM/YYYY, HH:MM - User: Message"');
    return;
  }

  globalData = data; // Store parsed data

  // Automatically render the active tab with new data
  const activeTabButton = document.querySelector('.tab-btn.active');
  if (activeTabButton) {
    showTab(activeTabButton.dataset.tab);
  } else {
    // Fallback to overview if no active tab is found (e.g., first load)
    showTab('overview');
  }
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