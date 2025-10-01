function generateRelationships(data, maxGap = 5, maxMinutes = 3) {
  const pairs = {};
  const matrix = {};
  const users = [...new Set(data.map(d => d.user))];

  console.log("Usuarios detectados:", users);

  // 1. Inicializar matriz acumulada
  users.forEach(u1 => {
    matrix[u1] = {};
    users.forEach(u2 => matrix[u1][u2] = 0);
  });

  // 2. Recorrer mensajes y acumular relaciones
  for (let i = 0; i < data.length; i++) {
    const sender = data[i].user;
    const t1 = parseTimestamp(data[i].timestamp ?? data[i].datetime);
    if (!t1) continue;

    for (let j = i + 1; j <= i + maxGap && j < data.length; j++) {
      const receiver = data[j].user;
      const t2 = parseTimestamp(data[j].timestamp ?? data[j].datetime);
      if (!t2) continue;

      if (sender !== receiver) {
        const diffMinutes = (t2 - t1) / 60000;
        if (diffMinutes <= maxMinutes) {
          // acumular en sender → receiver
          const key = [sender, receiver].sort().join(' & ');
          pairs[key] = (pairs[key] || 0) + 1;
          matrix[sender][receiver] += 1;

          console.log(`Reply detectado: ${sender} → ${receiver} | diff=${diffMinutes.toFixed(2)} min`);
        }
      }
    }
  }

  console.log("Pairs acumulados:", pairs);
  console.log("Matriz acumulada:", matrix);

  // 3. Render top pairs
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

  // 4. Heatmap con matriz acumulada
  html += '<h2>Reply Heatmap</h2><canvas id="replyHeatmap"></canvas>';
  document.getElementById('relationships').innerHTML = html;

  const ctx = document.getElementById('replyHeatmap')?.getContext('2d');
  if (!ctx) return;

  const matrixData = [];
  users.forEach((sender, row) => {
    users.forEach((receiver, col) => {
      const value = matrix[sender][receiver] ?? 0;
      matrixData.push({
        x: col,   // columna = receiver
        y: row,   // fila = sender
        v: value
      });
    });
  });

  new Chart(ctx, {
    type: 'matrix',
    data: {
      datasets: [{
        label: 'Replies',
        data: matrixData,
        backgroundColor(ctx) {
          const v = ctx.dataset.data[ctx.dataIndex].v;
          if (v === 0) return 'rgba(0,0,0,0.05)';
          const alpha = Math.min(1, v / 1000); // ajusta divisor según tamaño
          return `rgba(0,200,0,${alpha})`;
        },
        width: ({ chart }) =>
          chart.chartArea ? (chart.chartArea.width / users.length) - 2 : 10,
        height: ({ chart }) =>
          chart.chartArea ? (chart.chartArea.height / users.length) - 2 : 10,
      }]
    },
    options: {
      aspectRatio: 1,
      scales: {
        x: {
          type: 'category',
          labels: users,
          position: 'top',
          grid: { display: false },
          title: { display: true, text: 'Receiver' }
        },
        y: {
          type: 'category',
          labels: users,
          grid: { display: false },
          title: { display: true, text: 'Sender' }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: () => '',
            label: ctx => {
              const { x, y, v } = ctx.raw;
              return `${users[y]} → ${users[x]}: ${v} replies`;
            }
          }
        },
        legend: { display: false }
      }
    }
  });


  function parseTimestamp(ts) {
    if (!ts) return null;
    if (ts instanceof Date && !isNaN(ts)) return ts;
    if (typeof ts === "number") return new Date(ts);

    let t = new Date(ts);
    if (!isNaN(t)) return t;

    const match = ts.match(/(\d{2})\/(\d{2})\/(\d{2}), (\d{2}):(\d{2})/);
    if (match) {
      const [, dd, mm, yy, HH, MM] = match;
      return new Date(`20${yy}-${mm}-${dd}T${HH}:${MM}:00`);
    }
    return null;
  }
}
