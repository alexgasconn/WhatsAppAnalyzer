/**
 * Generates and displays activity-related charts.
 * @param {Array} data The parsed chat data.
 */
function generateActivity(data) {
  const hourCounts = new Array(24).fill(0);
  data.forEach(d => hourCounts[d.datetime.getHours()]++);

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdayCounts = new Array(7).fill(0);
  data.forEach(d => weekdayCounts[d.datetime.getDay()]++);

  const heatmap = Array(7).fill(null).map(() => Array(24).fill(0));
  data.forEach(d => {
    heatmap[d.datetime.getDay()][d.datetime.getHours()]++;
  });

  const html = `
    <div class="chart-container">
      <h3>⏰ Messages by Hour of Day</h3>
      <canvas id="activityHour"></canvas>
    </div>

    <div class="chart-container">
      <h3>📅 Messages by Day of Week</h3>
      <canvas id="activityWeekday"></canvas>
    </div>

    <div class="chart-container">
      <h3>🔥 Activity Heatmap</h3>
      <canvas id="activityHeatmap"></canvas>
    </div>
  `;

  document.getElementById('activity').innerHTML = html;

  // Chart 1: Messages by Hour
  const ctx1 = document.getElementById('activityHour').getContext('2d');
  chartInstances.push(new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: Array.from({length: 24}, (_, i) => `${i}:00`),
      datasets: [{
        label: 'Messages',
        data: hourCounts,
        backgroundColor: 'rgba(67, 233, 123, 0.7)'
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  }));

  // Chart 2: Messages by Day of Week
  const ctx2 = document.getElementById('activityWeekday').getContext('2d');
  chartInstances.push(new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: weekdayNames,
      datasets: [{
        label: 'Messages',
        data: weekdayCounts,
        backgroundColor: 'rgba(79, 172, 254, 0.7)'
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  }));

  // Chart 3: Activity Heatmap (Stacked Bar Chart for visual representation)
  // For a true heatmap, you'd typically use a different library or custom rendering.
  // This is a stacked bar chart showing messages per hour per day.
  const datasets = weekdayNames.map((day, i) => ({
    label: day,
    data: heatmap[i],
    backgroundColor: `hsla(${i * 50}, 70%, 60%, 0.7)` // Different color for each day
  }));
  
  const ctx3 = document.getElementById('activityHeatmap').getContext('2d');
  chartInstances.push(new Chart(ctx3, {
    type: 'bar',
    data: {
      labels: Array.from({length: 24}, (_, i) => `${i}:00`),
      datasets: datasets
    },
    options: {
      responsive: true,
      scales: {
        x: { 
          stacked: true,
          title: {
            display: true,
            text: 'Hour of Day'
          }
        },
        y: { 
          stacked: true,
          title: {
            display: true,
            text: 'Number of Messages'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Message Activity by Hour and Day'
        }
      }
    }
  }));
}