/**
 * Generates and displays relationship insights including a heatmap of replies.
 * @param {Array} data The parsed chat data (each item must have .user and .timestamp as Date).
 */
function generateRelationships(data) {
  const pairs = {};
  const matrix = {};
  const users = [...new Set(data.map(d => d.user))];

  // Initialize matrix
  users.forEach(u1 => {
    matrix[u1] = {};
    users.forEach(u2 => {
      matrix[u1][u2] = 0;
    });
  });

  // Iterate through messages to find replies (within 5 msgs and 5 minutes)
  for (let i = 0; i < data.length; i++) {
    const sender = data[i].user;
    const t1 = new Date(data[i].timestamp);

    for (let j = i + 1; j <= i + 5 && j < data.length; j++) {
      const receiver = data[j].user;
      const t2 = new Date(data[j].timestamp);

      if (sender !== receiver) {
        const diffMinutes = (t2 - t1) / 60000;
        if (diffMinutes <= 5) {
          // Count pair
          const key = [sender, receiver].sort().join(' & ');
          pairs[key] = (pairs[key] || 0) + 1;

          // Update directional matrix
          matrix[receiver][sender] += 1;
          break; // only the first valid reply counts
        }
      }
    }
  }

  // Sort pairs by count and take top 5
  const sortedPairs = Object.entries(pairs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  let html = '<h2>Top Conversational Pairs</h2><div class="relationship-grid">';
  if (sortedPairs.length === 0) {
    html += '<p>No direct conversational pairs found yet. Keep chatting!</p>';
  } else {
    sortedPairs.forEach(([pair, count]) => {
      html += `
        <div class="relationship-card">
          <h4>Pair: ${pair}</h4>
          <div class="relationship-item">
            <span class="relationship-label">Number of interactions</span>
            <span class="relationship-value">${count}</span>
          </div>
        </div>`;
    });
  }
  html += '</div>';

  // Build heatmap
  html += '<h2>Reply Heatmap</h2><canvas id="replyHeatmap"></canvas>';

  document.getElementById('relationships').innerHTML = html;

  // Render heatmap using Chart.js
  const ctx = document.getElementById('replyHeatmap').getContext('2d');
  const matrixData = [];
  users.forEach((u1, row) => {
    users.forEach((u2, col) => {
      matrixData.push({x: col, y: row, v: matrix[u1][u2]});
    });
  });

  new Chart(ctx, {
    type: 'matrix',
    data: {
      datasets: [{
        label: 'Replies',
        data: matrixData,
        backgroundColor(ctx) {
          const value = ctx.dataset.data[ctx.dataIndex].v;
          const alpha = value > 0 ? Math.min(0.9, 0.2 + value / 10) : 0;
          return `rgba(0, 123, 255, ${alpha})`;
        },
        width: ({chart}) => (chart.chartArea.width / users.length) - 2,
        height: ({chart}) => (chart.chartArea.height / users.length) - 2,
      }]
    },
    options: {
      scales: {
        x: {
          type: 'category',
          labels: users,
          position: 'top',
          grid: {display: false}
        },
        y: {
          type: 'category',
          labels: users,
          grid: {display: false}
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: () => '',
            label: ctx => {
              const {x, y, v} = ctx.raw;
              return `${users[y]} → ${users[x]}: ${v} replies`;
            }
          }
        }
      }
    }
  });
}
