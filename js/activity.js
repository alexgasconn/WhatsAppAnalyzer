/**
 * Generates and displays activity-related charts, including a custom heatmap.
 * @param {Array} data The parsed chat data.
 */
function generateActivity(data) {
  const hourCounts = new Array(24).fill(0);
  data.forEach(d => hourCounts[d.datetime.getHours()]++);

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdayCounts = new Array(7).fill(0);
  data.forEach(d => weekdayCounts[d.datetime.getDay()]++);

  // Heatmap data structure: [dayOfWeek][hourOfDay] = messageCount
  const heatmapData = Array(7).fill(null).map(() => Array(24).fill(0));
  let maxHeatmapValue = 0;
  data.forEach(d => {
    const day = d.datetime.getDay(); // 0 for Sunday, 6 for Saturday
    const hour = d.datetime.getHours(); // 0-23
    heatmapData[day][hour]++;
    if (heatmapData[day][hour] > maxHeatmapValue) {
        maxHeatmapValue = heatmapData[day][hour];
    }
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
      <h3>🔥 Activity Heatmap (Messages by Day & Hour)</h3>
      <div id="heatmapContainer" style="overflow-x: auto;">
        <div class="heatmap-grid" id="customHeatmapGrid"></div>
      </div>
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
        label: 'Total Messages',
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
        label: 'Total Messages',
        data: weekdayCounts,
        backgroundColor: 'rgba(79, 172, 254, 0.7)'
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  }));

  // Render the custom heatmap
  renderCustomHeatmap(heatmapData, maxHeatmapValue, weekdayNames);
}

/**
 * Renders a custom HTML/CSS grid-based heatmap.
 * @param {Array<Array<number>>} heatmapData 2D array [day][hour] of message counts.
 * @param {number} maxVal The maximum message count for coloring.
 * @param {Array<string>} dayLabels Array of weekday names.
 */
function renderCustomHeatmap(heatmapData, maxVal, dayLabels) {
    const gridContainer = document.getElementById('customHeatmapGrid');
    gridContainer.innerHTML = ''; // Clear previous content

    // Create the corner empty cell
    gridContainer.innerHTML += `<div class="heatmap-label corner-cell"></div>`;

    // Create hour labels (00-23)
    for (let h = 0; h < 24; h++) {
        gridContainer.innerHTML += `<div class="heatmap-label hour-label">${h.toString().padStart(2, '0')}</div>`;
    }

    // Create day labels and data cells
    dayLabels.forEach((dayLabel, dayIndex) => {
        gridContainer.innerHTML += `<div class="heatmap-label day-label">${dayLabel}</div>`; // Day label

        for (let hourIndex = 0; hourIndex < 24; hourIndex++) {
            const count = heatmapData[dayIndex][hourIndex];
            // Calculate color intensity: 0 (light) to 1 (dark/intense)
            const intensity = maxVal > 0 ? count / maxVal : 0;
            // Use HSL for coloring for better control (e.g., green scale)
            // Hue (H): 120 (green)
            // Saturation (S): 70%
            // Lightness (L): Varies from 95% (very light) to 40% (dark) based on intensity
            const lightness = 95 - (intensity * 55); // Adjust range for desired visual effect
            const backgroundColor = `hsl(120, 70%, ${lightness}%)`;

            gridContainer.innerHTML += `
                <div class="heatmap-cell" style="background-color: ${backgroundColor};" 
                     title="Day: ${dayLabel}, Hour: ${hourIndex.toString().padStart(2, '0')}, Messages: ${count}">
                    ${count > 0 ? count : ''}
                </div>`;
        }
    });
}