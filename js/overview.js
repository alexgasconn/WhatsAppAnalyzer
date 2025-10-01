/**
 * Generates and displays the overview statistics and charts.
 * @param {Array} data The parsed chat data.
 */
function generateOverview(data) {
  const users = [...new Set(data.map(d => d.user))];
  const dates = data.map(d => d.datetime);
  const firstDate = new Date(Math.min(...dates));
  const lastDate = new Date(Math.max(...dates));
  const daysDiff = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24));

  const totalWords = data.reduce((sum, d) => sum + d.message.split(/\s+/).filter(Boolean).length, 0);
  const avgWordsPerMsg = (totalWords / data.length).toFixed(1);

  const userCounts = {};
  data.forEach(d => userCounts[d.user] = (userCounts[d.user] || 0) + 1);

  const html = `
    <div class="stats-grid">
      <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <h3>Total Messages</h3>
        <div class="value">${data.length.toLocaleString()}</div>
        <div class="label">${(data.length / daysDiff).toFixed(1)} per day</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
        <h3>Participants</h3>
        <div class="value">${users.length}</div>
        <div class="label">${users.join(', ')}</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
        <h3>Duration</h3>
        <div class="value">${daysDiff}</div>
        <div class="label">days of conversation</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
        <h3>Total Words</h3>
        <div class="value">${totalWords.toLocaleString()}</div>
        <div class="label">${avgWordsPerMsg} avg per message</div>
      </div>
    </div>

    <div class="chart-container">
      <h3>📱 Message Distribution</h3>
      <canvas id="overviewPie"></canvas>
    </div>

    <div class="chart-container">
      <h3>📈 Messages Over Time</h3>
      <label for="timeGranularity">Granularity: </label>
      <select id="timeGranularity">
        <option value="day">Daily</option>
        <option value="week">Weekly</option>
        <option value="month">Monthly</option>
        <option value="year">Yearly</option>
      </select>
      <canvas id="overviewTimeline"></canvas>
    </div>
  `;

  document.getElementById('overviewContent').innerHTML = html;

  // Chart 1: Message Distribution
  const ctx1 = document.getElementById('overviewPie').getContext('2d');
  chartInstances.push(new Chart(ctx1, {
    type: 'doughnut',
    data: {
      labels: Object.keys(userCounts),
      datasets: [{
        data: Object.values(userCounts),
        backgroundColor: ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#feca57']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  }));

  // Function to aggregate messages
  function aggregateMessages(granularity) {
    const grouped = {};
    data.forEach(d => {
      const date = d.datetime;
      let key;
      switch (granularity) {
        case "day":
          key = date.toISOString().slice(0, 10);
          break;
        case "week":
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const pastDays = Math.floor((date - firstDayOfYear) / (1000 * 60 * 60 * 24));
          const week = Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7);
          key = `${date.getFullYear()}-W${week}`;
          break;
        case "month":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          break;
        case "year":
          key = `${date.getFullYear()}`;
          break;
      }
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return grouped;
  }

  // Chart 2: Messages Over Time
  const ctx2 = document.getElementById('overviewTimeline').getContext('2d');
  let timelineChart;

  function renderTimeline(granularity) {
    const grouped = aggregateMessages(granularity);
    const labels = Object.keys(grouped).sort();
    const values = labels.map(l => grouped[l]);

    if (timelineChart) timelineChart.destroy();

    timelineChart = new Chart(ctx2, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `Messages per ${granularity}`,
          data: values,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            type: 'category'
          }
        }
      }
    });
  }

  // Initial render (daily)
  renderTimeline("day");

  // Listener for dropdown
  document.getElementById("timeGranularity").addEventListener("change", e => {
    renderTimeline(e.target.value);
  });
}
