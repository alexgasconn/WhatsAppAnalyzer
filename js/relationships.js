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
    const t1 = parseTimestamp(data[i].timestamp ?? data[i].datetime);
    if (!t1) {
      console.warn("Timestamp inválido:", data[i].timestamp ?? data[i].datetime);
      continue;
    }

    for (let j = i + 1; j <= i + maxGap && j < data.length; j++) {
      const receiver = data[j].user;
      const t2 = parseTimestamp(data[j].timestamp ?? data[j].datetime);
      if (!t2) {
        console.warn("Timestamp inválido:", data[j].timestamp ?? data[j].datetime);
        continue;
      }

      if (sender !== receiver) {
        const diffMinutes = (t2 - t1) / 60000;
        if (diffMinutes <= maxMinutes) {
          const key = [sender, receiver].sort().join(' & ');
          pairs[key] = (pairs[key] || 0) + 1;
          matrix[receiver][sender] += 1;
          console.log(`Reply detectado: ${receiver} → ${sender} | diff=${diffMinutes.toFixed(2)} min`);
        }
      }
    }
  }

  console.log("Pairs acumulados:", pairs);
  console.log("Matriz acumulada:", matrix);

  // Render top pairs
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

  // Heatmap
  html += '<h2>Reply Heatmap</h2><canvas id="replyHeatmap"></canvas>';
  document.getElementById('relationships').innerHTML = html;

  const ctx = document.getElementById('replyHeatmap')?.getContext('2d');
  if (!ctx) return; // seguridad

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
          if (value === 0) return 'rgba(0,0,0,0.05)';
          const alpha = Math.min(1, value / 50); // ajustar escala si es un chat grande
          return `rgba(0, 200, 0, ${alpha})`;
        },
        width: ({chart}) => chart.chartArea ? (chart.chartArea.width / users.length) - 2 : 10,
        height: ({chart}) => chart.chartArea ? (chart.chartArea.height / users.length) - 2 : 10,
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

function parseTimestamp(ts) {
  if (!ts) return null;

  // si ya es Date válido
  if (ts instanceof Date && !isNaN(ts)) return ts;

  // si es número de ms
  if (typeof ts === "number") return new Date(ts);

  // Intentamos ISO directo
  let t = new Date(ts);
  if (!isNaN(t)) return t;

  // WhatsApp style dd/MM/yy, HH:mm
  const match = ts.match(/(\d{2})\/(\d{2})\/(\d{2}), (\d{2}):(\d{2})/);
  if (match) {
    const [, dd, mm, yy, HH, MM] = match;
    return new Date(`20${yy}-${mm}-${dd}T${HH}:${MM}:00`);
  }

  return null; // no se pudo parsear
}
