function generateRelationships(data, maxGap = 5, maxMinutes = 5) {
  const pairs = {};
  const matrix = {};
  const users = [...new Set(data.map(d => d.user))];

  // Estadísticas adicionales
  const userStats = {};
  const userReplies = {};

  users.forEach(u => {
    userStats[u] = { sent: 0, avg_length: 0, longest: 0, hours: new Map() };
    userReplies[u] = { received: 0, avg_response_time: 0 };
  });

  // 1. Inicializar matriz
  users.forEach(u1 => {
    matrix[u1] = {};
    users.forEach(u2 => matrix[u1][u2] = 0);
  });

  // 2. Calcular estadísticas básicas
  data.forEach(msg => {
    const user = msg.user;
    userStats[user].sent++;
    userStats[user].avg_length += msg.message.length;
    userStats[user].longest = Math.max(userStats[user].longest, msg.message.length);

    const hour = msg.datetime.getHours();
    userStats[user].hours.set(hour, (userStats[user].hours.get(hour) || 0) + 1);
  });

  // Normalizar promedio de longitud
  users.forEach(u => {
    userStats[u].avg_length = Math.round(userStats[u].avg_length / userStats[u].sent);
  });

  // 3. Detectar respuestas y relaciones
  for (let i = 0; i < data.length - 1; i++) {
    const sender = data[i].user;
    const t1 = data[i].datetime;

    for (let j = i + 1; j <= i + maxGap && j < data.length; j++) {
      const receiver = data[j].user;
      const t2 = data[j].datetime;

      if (sender !== receiver) {
        const diffMinutes = (t2 - t1) / 60000;
        if (diffMinutes <= maxMinutes && diffMinutes > 0) {
          const key = [sender, receiver].sort().join(' & ');
          pairs[key] = (pairs[key] || 0) + 1;
          matrix[sender][receiver] += 1;
          userReplies[receiver].received++;
          userReplies[receiver].avg_response_time = diffMinutes;
        }
      }
    }
  }

  // 4. Build HTML content
  const sortedPairs = Object.entries(pairs).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topUsers = Object.entries(userStats)
    .sort((a, b) => b[1].sent - a[1].sent)
    .slice(0, 5);

  let html = `
    <div class="chart-container">
      <h3>👥 Usuarios Más Activos</h3>
      <div class="relationship-grid">
  `;

  topUsers.forEach(([user, stats]) => {
    html += `
      <div class="relationship-card">
        <h4>📱 ${user}</h4>
        <div class="relationship-item">
          <span class="relationship-label">Mensajes:</span>
          <span class="relationship-value">${stats.sent}</span>
        </div>
        <div class="relationship-item">
          <span class="relationship-label">Promedio longitud:</span>
          <span class="relationship-value">${stats.avg_length} chars</span>
        </div>
        <div class="relationship-item">
          <span class="relationship-label">Mensaje más largo:</span>
          <span class="relationship-value">${stats.longest} chars</span>
        </div>
      </div>
    `;
  });

  html += `</div></div>`;

  // 5. Top conversational pairs
  html += `<div class="chart-container"><h3>🤝 Pares Más Conversadores</h3><div class="relationship-grid">`;
  if (sortedPairs.length === 0) {
    html += '<p style="padding: 20px;">Sin patrones de respuesta detectados.</p>';
  } else {
    sortedPairs.forEach(([pair, count], idx) => {
      html += `
        <div class="relationship-card">
          <h4>#${idx + 1} ${pair}</h4>
          <div class="relationship-item">
            <span class="relationship-label">Interacciones:</span>
            <span class="relationship-value">${count}</span>
          </div>
        </div>`;
    });
  }
  html += `</div></div>`;

  // 6. Heatmap
  html += `<div class="chart-container"><h3>🔥 Matriz de Respuestas</h3><div id="relationshipHeatmap" class="heatmap-grid"></div></div>`;

  document.getElementById('relationships').innerHTML = html;

  renderUserHeatmap(matrix);

  // --- Helpers ---
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

  function renderUserHeatmap(matrix) {
    const users = Object.keys(matrix);
    const gridContainer = document.getElementById('relationshipHeatmap');

    // Set grid columns
    gridContainer.style.gridTemplateColumns = `repeat(${users.length + 1}, minmax(60px, 1fr))`;

    // Build all HTML at once
    let htmlContent = `<div class="heatmap-label corner-cell"></div>`;

    // Column headers (recipient users)
    users.forEach(u => {
      htmlContent += `<div class="heatmap-label user-label" style="font-weight: bold; text-align: center;">${u}</div>`;
    });

    // Rows
    users.forEach(rowUser => {
      htmlContent += `<div class="heatmap-label" style="font-weight: bold;">${rowUser}</div>`;

      users.forEach(colUser => {
        const value = matrix[rowUser][colUser] || 0;
        const maxVal = getMaxValue(matrix);
        const intensity = maxVal > 0 ? value / maxVal : 0;
        const lightness = 95 - (intensity * 55);
        const backgroundColor = `hsl(200, 70%, ${lightness}%)`;

        htmlContent += `<div class="heatmap-cell" 
               style="background-color:${backgroundColor}; display: flex; align-items: center; justify-content: center;" 
               title="${rowUser} → ${colUser}: ${value} respuestas">
            ${value > 0 ? value : ''}
          </div>`;
      });
    });

    gridContainer.innerHTML = htmlContent;
  }


  function getMaxValue(matrix) {
    let max = 0;
    for (let u1 in matrix) {
      for (let u2 in matrix[u1]) {
        if (matrix[u1][u2] > max) max = matrix[u1][u2];
      }
    }
    return max;
  }
}
