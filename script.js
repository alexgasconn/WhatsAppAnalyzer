function handleFile() {
  const input = document.getElementById("fileInput");
  const file = input.files[0];
  if (!file) return alert("Upload a .txt file!");

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    const messages = parseChat(content);
    const stats = calculateStats(messages);
    displayStats(stats);
    drawChart(stats.perUserCount);
  };
  reader.readAsText(file);
}

// Parse WhatsApp messages
function parseChat(text) {
  const lines = text.split("\n");
  const regex = /^(\d{1,2}\/\d{1,2}\/\d{2,4}), (\d{1,2}:\d{2}) - (.*?): (.*)$/;
  const messages = [];

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      const [_, date, time, user, message] = match;
      messages.push({ date, time, user, message });
    }
  }
  return messages;
}

// Calculate statistics
function calculateStats(messages) {
  const perUserCount = {};
  const daysSet = new Set();
  let totalLength = 0;

  for (const msg of messages) {
    perUserCount[msg.user] = (perUserCount[msg.user] || 0) + 1;
    daysSet.add(msg.date);
    totalLength += msg.message.length;
  }

  return {
    totalMessages: messages.length,
    totalDays: daysSet.size,
    avgPerDay: (messages.length / daysSet.size).toFixed(2),
    avgLength: (totalLength / messages.length).toFixed(2),
    numUsers: Object.keys(perUserCount).length,
    perUserCount
  };
}

// Display stats on the page
function displayStats(stats) {
  const statsDiv = document.getElementById("stats");
  statsDiv.innerHTML = `
    <h2>Chat Statistics</h2>
    <ul>
      <li><strong>Total messages:</strong> ${stats.totalMessages}</li>
      <li><strong>Total days:</strong> ${stats.totalDays}</li>
      <li><strong>Average messages per day:</strong> ${stats.avgPerDay}</li>
      <li><strong>Average message length:</strong> ${stats.avgLength}</li>
      <li><strong>Number of users:</strong> ${stats.numUsers}</li>
    </ul>
  `;
}

// Draw a bar chart of messages per user
function drawChart(perUserCount) {
  const ctx = document.getElementById('chart').getContext('2d');
  const users = Object.keys(perUserCount);
  const counts = Object.values(perUserCount);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: users,
      datasets: [{
        label: 'Messages per user',
        data: counts
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Messages per User' }
      }
    }
  });
}
