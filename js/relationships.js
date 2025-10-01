function generateRelationships(data, maxGap = 5, maxMinutes = 1) {
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

  // 4. Heatmap con matriz acumulada (HTML/CSS grid)
  html += '<h2>Reply Heatmap</h2><div id="relationshipHeatmap" class="heatmap-grid"></div>';
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
    gridContainer.innerHTML = '';

    // columnas = 1 corner + N usuarios
    gridContainer.style.gridTemplateColumns = `repeat(${users.length + 1}, minmax(60px, 1fr))`;

    // esquina vacía
    gridContainer.innerHTML += `<div class="heatmap-label corner-cell"></div>`;

    // etiquetas columnas (usuarios receptores)
    users.forEach(u => {
      gridContainer.innerHTML += `<div class="heatmap-label user-label">${u}</div>`;
    });

    // filas
    users.forEach(rowUser => {
      // etiqueta fila
      gridContainer.innerHTML += `<div class="heatmap-label">${rowUser}</div>`;

      users.forEach(colUser => {
        const value = matrix[rowUser][colUser] || 0;
        const maxVal = getMaxValue(matrix);
        const intensity = maxVal > 0 ? value / maxVal : 0;
        const lightness = 95 - (intensity * 55);
        const backgroundColor = `hsl(200, 70%, ${lightness}%)`;

        gridContainer.innerHTML += `
          <div class="heatmap-cell" 
               style="background-color:${backgroundColor}" 
               title="${rowUser} → ${colUser}: ${value}">
            ${value > 0 ? value : ''}
          </div>`;
      });
    });
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
