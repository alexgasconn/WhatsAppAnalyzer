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

    // Draw the bar chart for messages per user
    drawChart(stats.perUserCount);

    // Calculate and draw the hourly histogram
    const hourlyCounts = calculateHourlyDistribution(messages);
    drawHourlyHistogram(hourlyCounts);

    // Calculate and draw the day-hour heatmap
    const dayHourHeatmap = calculateDayHourHeatmap(messages);
    drawDayHourHeatmap(dayHourHeatmap);

    // Calculate and draw the month-year heatmap
    const monthYearHeatmap = calculateMonthYearHeatmap(messages);
    drawMonthYearHeatmap(monthYearHeatmap);
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

// Calculate hourly distribution of messages
function calculateHourlyDistribution(messages) {
  const hourlyCounts = Array(24).fill(0); // Initialize an array with 24 zeros

  for (const msg of messages) {
    const hour = parseInt(msg.time.split(":")[0], 10); // Extract the hour from the time
    hourlyCounts[hour]++;
  }

  return hourlyCounts;
}

// Calculate day-hour heatmap of messages
function calculateDayHourHeatmap(messages) {
  const heatmap = Array(7).fill(null).map(() => Array(24).fill(0)); // 7 days x 24 hours

  for (const msg of messages) {
    const date = new Date(msg.date + " " + msg.time);
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hour = parseInt(msg.time.split(":")[0], 10); // Extract hour
    heatmap[day][hour]++;
  }

  return heatmap;
}

// Calculate month-year heatmap of messages
function calculateMonthYearHeatmap(messages) {
  const heatmap = {};
  for (const msg of messages) {
    const date = new Date(msg.date + " " + msg.time);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0 = January, 1 = February, ..., 11 = December

    if (!heatmap[year]) heatmap[year] = Array(12).fill(0); // Initialize months for the year
    heatmap[year][month]++;
  }

  return heatmap;
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

// Draw a histogram of messages per hour
function drawHourlyHistogram(hourlyCounts) {
  const ctx = document.getElementById('hourlyChart').getContext('2d');
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`); // Generate labels for 24 hours

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: hours,
      datasets: [{
        label: 'Messages per Hour',
        data: hourlyCounts,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Messages per Hour' }
      },
      scales: {
        x: { title: { display: true, text: 'Hour of the Day' } },
        y: { title: { display: true, text: 'Number of Messages' } }
      }
    }
  });
}

// Draw a heatmap of messages by day and hour
function drawDayHourHeatmap(heatmap) {
  const ctx = document.getElementById("dayHourHeatmap").getContext("2d");
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  new Chart(ctx, {
    type: "matrix",
    data: {
      labels: hours,
      datasets: [{
        label: "Messages",
        data: heatmap.flatMap((row, day) =>
          row.map((value, hour) => ({ x: hour, y: day, v: value }))
        ),
        backgroundColor: (ctx) => {
          const value = ctx.raw.v;
          return `rgba(75, 192, 192, ${value / Math.max(...heatmap.flat())})`;
        },
        borderWidth: 1,
        borderColor: "rgba(75, 192, 192, 1)"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Messages by Day and Hour" }
      },
      scales: {
        x: { title: { display: true, text: "Hour of the Day" } },
        y: {
          title: { display: true, text: "Day of the Week" },
          ticks: { callback: (value) => days[value] }
        }
      }
    }
  });
}

// Draw a heatmap of messages by month and year
function drawMonthYearHeatmap(heatmap) {
  const ctx = document.getElementById("monthYearHeatmap").getContext("2d");
  const years = Object.keys(heatmap).sort();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const data = years.flatMap((year, yIndex) =>
    heatmap[year].map((value, month) => ({ x: month, y: yIndex, v: value }))
  );

  new Chart(ctx, {
    type: "matrix",
    data: {
      labels: months,
      datasets: [{
        label: "Messages",
        data: data,
        backgroundColor: (ctx) => {
          const value = ctx.raw.v;
          return `rgba(255, 99, 132, ${value / Math.max(...data.map(d => d.v))})`;
        },
        borderWidth: 1,
        borderColor: "rgba(255, 99, 132, 1)"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Messages by Month and Year" }
      },
      scales: {
        x: { title: { display: true, text: "Month" } },
        y: {
          title: { display: true, text: "Year" },
          ticks: { callback: (value) => years[value] }
        }
      }
    }
  });
}
