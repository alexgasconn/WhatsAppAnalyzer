// OVERVIEW: Estadísticas Generales y Resumen

function generateOverview(data) {
  if (data.length === 0) {
    document.getElementById('overviewContent').innerHTML = '<p class="error-message">Sin datos</p>';
    return;
  }

  const users = [...new Set(data.map(d => d.user))];
  const dates = data.map(d => d.datetime);
  const firstDate = new Date(Math.min(...dates));
  const lastDate = new Date(Math.max(...dates));
  const daysDiff = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;

  const totalWords = data.reduce((sum, d) => sum + d.message.split(/\s+/).filter(Boolean).length, 0);
  const avgWordsPerMsg = (totalWords / data.length).toFixed(1);

  const userCounts = {};
  let maxUserMessages = 0;
  data.forEach(d => {
    userCounts[d.user] = (userCounts[d.user] || 0) + 1;
    maxUserMessages = Math.max(maxUserMessages, userCounts[d.user]);
  });

  const avgPerUser = (data.length / users.length).toFixed(1);
  const longestMsg = data.reduce((a, b) => a.message.length > b.message.length ? a : b);

  const hourlyCounts = new Array(24).fill(0);
  data.forEach(d => hourlyCounts[d.datetime.getHours()]++);
  const peakHour = hourlyCounts.indexOf(Math.max(...hourlyCounts));
  const peakHourCount = Math.max(...hourlyCounts);

  const html = `
    <div class="stats-grid">
      <div class="stat-card">
        <h3>💬 Total Mensajes</h3>
        <div class="value">${data.length.toLocaleString()}</div>
        <div class="label">${(data.length / daysDiff).toFixed(1)} por día</div>
      </div>
      <div class="stat-card">
        <h3>👥 Participantes</h3>
        <div class="value">${users.length}</div>
        <div class="label">${Math.round((data.length / users.length))} msg promedio</div>
      </div>
      <div class="stat-card">
        <h3>📅 Duración</h3>
        <div class="value">${daysDiff}</div>
        <div class="label">días</div>
      </div>
      <div class="stat-card">
        <h3>📝 Total Palabras</h3>
        <div class="value">${totalWords.toLocaleString()}</div>
        <div class="label">${avgWordsPerMsg} por mensaje</div>
      </div>
      <div class="stat-card">
        <h3>🏆 Más Activo</h3>
        <div class="value">${Object.entries(userCounts).reduce((a, b) => b[1] > a[1] ? b : a)[1]}</div>
        <div class="label">${Object.entries(userCounts).reduce((a, b) => b[1] > a[1] ? b : a)[0]}</div>
      </div>
      <div class="stat-card">
        <h3>🕐 Hora Pico</h3>
        <div class="value">${String(peakHour).padStart(2, '0')}:00</div>
        <div class="label">${peakHourCount} mensajes</div>
      </div>
    </div>

    <div class="chart-container">
      <h3>📊 Mensajes por Usuario</h3>
      <div style="height: 300px;"><canvas id="userMessagesChart"></canvas></div>
    </div>

    <div class="chart-container">
      <h3>🕒 Actividad por Hora del Día</h3>
      <div style="height: 300px;"><canvas id="hourlyChart"></canvas></div>
    </div>

    <div class="chart-container">
      <h3>📈 Mensajes en el Tiempo</h3>
      <div style="height: 300px;"><canvas id="timelineChart"></canvas></div>
    </div>

    <div class="prediction-card">
      <h4>📝 Detalles del Mensaje Más Largo</h4>
      <div style="margin-top: 12px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px;">
        <strong>${longestMsg.user}</strong> (${longestMsg.datetime.toLocaleString('es-ES')})<br>
        <em style="opacity: 0.9;">"${longestMsg.message.substring(0, 100)}${longestMsg.message.length > 100 ? '...' : ''}"</em><br>
        <small>${longestMsg.message.length} caracteres</small>
      </div>
    </div>
  `;

  document.getElementById('overviewContent').innerHTML = html;

  // Gráfico 1: Mensajes por Usuario
  const userLabels = Object.keys(userCounts).sort((a, b) => userCounts[b] - userCounts[a]);
  const userValues = userLabels.map(u => userCounts[u]);

  const ctx1 = document.getElementById('userMessagesChart');
  createChart(ctx1, {
    type: 'bar',
    data: {
      labels: userLabels,
      datasets: [{
        label: 'Mensajes',
        data: userValues,
        backgroundColor: userLabels.map((_, i) => {
          const colors = ['#25D366', '#667eea', '#764ba2', '#4facfe', '#00f2fe', '#ff9966', '#f5576c'];
          return colors[i % colors.length];
        }),
        borderColor: userLabels.map((_, i) => {
          const colors = ['#128C7E', '#5568d3', '#653b81', '#0c7dd0', '#00c4a8', '#ff7733', '#c13a2f'];
          return colors[i % colors.length];
        }),
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: userLabels.length > 5 ? 'y' : 'x',
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // Gráfico 2: Actividad por Hora
  const ctx2 = document.getElementById('hourlyChart');
  createChart(ctx2, {
    type: 'line',
    data: {
      labels: Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0') + ':00'),
      datasets: [{
        label: 'Mensajes por Hora',
        data: hourlyCounts,
        borderColor: '#25D366',
        backgroundColor: 'rgba(37, 211, 102, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#25D366',
        pointBorderColor: 'white',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // Gráfico 3: Mensajes en el Tiempo (Diarios)
  const dailyMessages = new Map();
  data.forEach(msg => {
    const date = msg.datetime.toLocaleDateString('es-ES');
    dailyMessages.set(date, (dailyMessages.get(date) || 0) + 1);
  });

  const sortedDates = Array.from(dailyMessages.keys()).sort((a, b) => {
    return new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'));
  }).slice(-30); // Últimos 30 días

  const ctx3 = document.getElementById('timelineChart');
  createChart(ctx3, {
    type: 'area',
    data: {
      labels: sortedDates,
      datasets: [{
        label: 'Mensajes por Día',
        data: sortedDates.map(d => dailyMessages.get(d)),
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#667eea'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true } }
    }
  });
}
