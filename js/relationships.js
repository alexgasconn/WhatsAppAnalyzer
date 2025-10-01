function generateRelationships(data, maxGap = 15, maxMinutes = 30) {
  const pairs = {};
  const matrix = {};
  const users = [...new Set(data.map(d => d.user))];

  console.log("Usuarios detectados:", users);

  // init matrix
  users.forEach(u1 => {
    matrix[u1] = {};
    users.forEach(u2 => matrix[u1][u2] = 0);
  });

  for (let i = 0; i < data.length; i++) {
    const sender = data[i].user;
    const t1 = new Date(data[i].timestamp);

    for (let j = i + 1; j <= i + maxGap && j < data.length; j++) {
      const receiver = data[j].user;
      const t2 = new Date(data[j].timestamp);

      if (sender !== receiver) {
        const diffMinutes = (t2 - t1) / 60000;

        if (diffMinutes <= maxMinutes) {
          const key = [sender, receiver].sort().join(' & ');
          pairs[key] = (pairs[key] || 0) + 1;
          matrix[receiver][sender] += 1;

          console.log(`Reply detectado: ${receiver} → ${sender} | diff=${diffMinutes.toFixed(2)} min`);
        } else {
          // demasiado tiempo
          console.log(`Saltado: ${receiver} → ${sender}, diff=${diffMinutes.toFixed(2)} min > ${maxMinutes}`);
        }
      }
    }
  }

  console.log("Pairs acumulados:", pairs);
  console.log("Matriz acumulada:", matrix);

  // render top pairs
  const sortedPairs = Object.entries(pairs).sort((a, b) => b[1] - a[1]).slice(0, 5);
  let html = '<h2>Top Conversational Pairs</h2><div class="relationship-grid">';
  if (sortedPairs.length === 0) {
    html += '<p>No conversational pairs found.</p>';
  } else {
    sortedPairs.forEach(([pair, count]) => {
      html += `
        <div class="relationship-card">
          <h4>Pair: ${pair}</h4>
          <div class="relationship-item">
            <span class="relationship-label">Interactions</span>
            <span class="relationship-value">${count}</span>
          </div>
        </div>`;
    });
  }
  html += '</div>';

  // heatmap
  html += '<h2>Reply Heatmap</h2><canvas id="replyHeatmap"></canvas>';
  document.getElementById('relationships').innerHTML = html;

  // chart.js matrix
  const ctx = document.getElementById('replyHeatmap').getContext('2d');
  const matrixData = [];
  users.forEach((u1, row) => {
    users.forEach((u2, col) => {
      matrixData.push({x: col, y: row, v: matrix[u1][u2]});
    });
  });

  console.log("Datos heatmap:", matrixData);

  new Chart(ctx, {
    type: 'matrix',
    data: {
      datasets: [{
        label: 'Replies',
        data: matrixData,
        backgroundColor(ctx) {
          const value = ctx.dataset.data[ctx.dataIndex].v;
          if (value === 0) return 'rgba(0,0,0,0.05)';
          const alpha = Math.min(1, value / 50);
          return `rgba(0, 200, 0, ${alpha})`;
        },
        width: ({chart}) => (chart.chartArea.width / users.length) - 2,
        height: ({chart}) => (chart.chartArea.height / users.length) - 2,
      }]
    },
    options: {
      scales: {
        x: { type: 'category', labels: users, position: 'top', grid: {display: false} },
        y: { type: 'category', labels: users, grid: {display: false} }
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
