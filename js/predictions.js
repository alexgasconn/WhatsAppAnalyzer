// PREDICCIONES: Análisis Predictivo y Tendencias

function generatePredictions(data) {
    const container = document.getElementById('predictions');
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = '<p class="error-message">Sin datos para predicciones</p>';
        return;
    }

    // Preparar datos
    const dailyCounts = new Map();
    const userActivity = new Map();
    const hourActivity = new Array(24).fill(0);

    data.forEach(msg => {
        const date = msg.datetime.toLocaleDateString('es-ES');
        dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);

        const hour = msg.datetime.getHours();
        hourActivity[hour]++;

        if (!userActivity.has(msg.user)) {
            userActivity.set(msg.user, { messages: 0, lastDate: msg.datetime });
        }
        const user = userActivity.get(msg.user);
        user.messages++;
        user.lastDate = msg.datetime;
    });

    // Calcular estadísticas
    const sortedDates = Array.from(dailyCounts.keys()).sort((a, b) => {
        return new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'));
    });

    const messagesArray = sortedDates.map(d => dailyCounts.get(d));
    const avgPerDay = (messagesArray.reduce((a, b) => a + b, 0) / messagesArray.length).toFixed(1);
    const maxPerDay = Math.max(...messagesArray);
    const minPerDay = Math.min(...messagesArray);
    const trend = calculateTrend(messagesArray);

    // Predicciones
    const predictions = predictMessages(messagesArray, 7); // Próximos 7 días
    const userPredictions = getPowerUsers(userActivity);

    const html = `
    <div class="stats-grid">
      <div class="prediction-card">
        <h4>📊 Promedio Diario</h4>
        <div class="prediction-value">${avgPerDay}</div>
        <div class="prediction-details">
          Min: ${minPerDay} | Max: ${maxPerDay}
        </div>
      </div>
      
      <div class="prediction-card">
        <h4>📈 Tendencia</h4>
        <div class="prediction-value" style="color: ${trend > 0 ? '#43e97b' : trend < 0 ? '#f5576c' : '#fee140'}">
          ${trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} ${Math.abs(trend).toFixed(1)}%
        </div>
        <div class="prediction-details">
          ${trend > 0 ? 'Aumentando' : trend < 0 ? 'Disminuyendo' : 'Estable'}
        </div>
      </div>
      
      <div class="prediction-card">
        <h4>🎯 Predicción 7 Días</h4>
        <div class="prediction-value">${predictions.slice(-1)[0]}</div>
        <div class="prediction-details">
          Promedio: ${(predictions.reduce((a, b) => a + b, 0) / predictions.length).toFixed(0)} msgs/día
        </div>
      </div>
      
      <div class="prediction-card">
        <h4>👥 Usuarios Más Activos</h4>
        <div class="prediction-value">${userPredictions.length}</div>
        <div class="prediction-details">
          ${userPredictions.slice(0, 2).map(u => u.user).join(', ')}
        </div>
      </div>
    </div>

    <div class="chart-container">
      <h3>🔮 Predicción de Mensajes (7 próximos días)</h3>
      <div style="height: 300px;"><canvas id="predictionChart"></canvas></div>
    </div>

    <div class="chart-container">
      <h3>📊 Actividad de Usuarios - Predicción</h3>
      <div style="height: 300px;"><canvas id="userPredictionChart"></canvas></div>
    </div>

    <div class="relationship-grid">
      ${userPredictions.slice(0, 5).map((user, idx) => `
        <div class="relationship-card">
          <h4>#${idx + 1} ${user.user}</h4>
          <div class="relationship-item">
            <span class="relationship-label">Mensajes:</span>
            <span class="relationship-value">${user.messages}</span>
          </div>
          <div class="relationship-item">
            <span class="relationship-label">% del Total:</span>
            <span class="relationship-value">${user.percentage}%</span>
          </div>
          <div class="relationship-item">
            <span class="relationship-label">Frecuencia Est.:</span>
            <span class="relationship-value">${estimateFrequency(data, user.user)} msgs</span>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="chart-container">
      <h3>🕒 Patrones de Actividad Horaria</h3>
      <div style="height: 250px;"><canvas id="hourPredictionChart"></canvas></div>
    </div>
  `;

    container.innerHTML = html;

    // Gráfico 1: Predicción General
    const lastDates = sortedDates.slice(-30);
    const lastMessages = lastDates.map(d => dailyCounts.get(d));
    const allDates = [...lastDates, ...Array(7).fill(null).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        return d.toLocaleDateString('es-ES');
    })];

    const allData = [...lastMessages, ...predictions];

    const ctx1 = document.getElementById('predictionChart');
    createChart(ctx1, {
        type: 'line',
        data: {
            labels: allDates.map(d => d.substring(0, 5)),
            datasets: [
                {
                    label: 'Histórico',
                    data: [...lastMessages, null, null, null, null, null, null, null],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Predicción',
                    data: [...Array(lastMessages.length).fill(null), ...predictions],
                    borderColor: '#f5576c',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    pointBackgroundColor: '#f5576c',
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // Gráfico 2: Predicción de Usuarios
    const topUsers = userPredictions.slice(0, 5);
    const ctx2 = document.getElementById('userPredictionChart');
    createChart(ctx2, {
        type: 'doughnut',
        data: {
            labels: topUsers.map(u => u.user),
            datasets: [{
                data: topUsers.map(u => u.messages),
                backgroundColor: [
                    '#25D366', '#667eea', '#764ba2', '#4facfe', '#00f2fe'
                ],
                borderColor: 'white',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // Gráfico 3: Patrones Horarios
    const ctx3 = document.getElementById('hourPredictionChart');
    createChart(ctx3, {
        type: 'bar',
        data: {
            labels: Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0') + ':00'),
            datasets: [{
                label: 'Mensajes por Hora',
                data: hourActivity,
                backgroundColor: hourActivity.map(v => {
                    const max = Math.max(...hourActivity);
                    const intensity = v / max;
                    return `rgba(37, 211, 102, ${0.3 + intensity * 0.7})`;
                }),
                borderColor: '#25D366',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

// FUNCIONES HELPER

function calculateTrend(arr) {
    if (arr.length < 2) return 0;
    const firstHalf = arr.slice(0, Math.floor(arr.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(arr.length / 2);
    const secondHalf = arr.slice(Math.floor(arr.length / 2)).reduce((a, b) => a + b, 0) / (arr.length - Math.floor(arr.length / 2));
    return ((secondHalf - firstHalf) / firstHalf) * 100;
}

function predictMessages(arr, days) {
    if (arr.length === 0) return Array(days).fill(0);

    const predictions = [];
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    const seasonality = arr.length >= 7 ? arr.slice(-7).reduce((a, b) => a + b, 0) / 7 : avg;
    const noise = (Math.random() - 0.5) * 2;

    for (let i = 0; i < days; i++) {
        const predicted = Math.round(seasonality * (1 + noise * 0.1));
        predictions.push(Math.max(0, predicted));
    }

    return predictions;
}

function getPowerUsers(userActivity) {
    const total = Array.from(userActivity.values()).reduce((a, b) => a + b.messages, 0);
    return Array.from(userActivity.entries())
        .map(([user, data]) => ({
            user,
            messages: data.messages,
            percentage: ((data.messages / total) * 100).toFixed(1),
            lastActive: data.lastDate
        }))
        .sort((a, b) => b.messages - a.messages);
}

function estimateFrequency(data, user) {
    const userMessages = data.filter(m => m.user === user);
    if (userMessages.length < 2) return userMessages.length;

    const firstMsg = userMessages[0].datetime;
    const lastMsg = userMessages[userMessages.length - 1].datetime;
    const days = Math.ceil((lastMsg - firstMsg) / (1000 * 60 * 60 * 24)) || 1;

    return Math.round(userMessages.length / days);
}
const deviation = arr.length > 0 ? Math.abs(arr[arr.length - 1] - arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
const alpha = Math.min(0.9, 0.3 + 0.7 * Math.min(1, deviation / Math.max(1, arr.reduce((a, b) => a + b, 0) / arr.length)));
const nextVal = lastVal + trend + seasonal;
const smoothed = alpha * nextVal + (1 - alpha) * lastVal;
forecast.push(Math.round(smoothed));
trend = 0.7 * trend + 0.3 * (smoothed - lastVal);
lastVal = smoothed;
        }
return forecast;
    }

// --- Weekly aggregation ---
function aggregateWeekly(arr) {
    const weeks = [];
    for (let i = 0; i < arr.length; i += 7) {
        weeks.push(arr.slice(i, i + 7).reduce((a, b) => a + b, 0));
    }
    return weeks;
}

const dailyWeeks = aggregateWeekly(countsArray);
const forecastWeeks = 12; // next 12 weeks
const forecastValues = adaptiveSARIMA(dailyWeeks, forecastWeeks, seasonLength);

// --- Generate chart labels (weekly) ---
const lastDate = new Date(sortedDays[sortedDays.length - 1]);
const chartLabels = [];
for (let i = 0; i < dailyWeeks.length + forecastWeeks; i++) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() + i * 7);
    chartLabels.push(d.toISOString().slice(0, 10));
}

const chartDataActual = [...dailyWeeks, ...Array(forecastWeeks).fill(null)];
const chartDataForecast = [...Array(dailyWeeks.length).fill(null), ...forecastValues];

// --- Compute group + top user ---
const userCounts = {};
data.forEach(d => userCounts[d.user] = (userCounts[d.user] || 0) + 1);
const topUser = Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0];

// --- Compute group forecast sums ---
const groupForecast7 = forecastValues.slice(0, 1)[0] || 0; // first week
const groupForecast30 = forecastValues.slice(0, 4).reduce((a, b) => a + b, 0); // ~1 month
const groupForecast90 = forecastValues.slice(0, 12).reduce((a, b) => a + b, 0); // 3 months

// --- Compute per-user forecasts ---
const users = [...new Set(data.map(d => d.user))];
const userForecasts = {};
users.forEach(u => {
    const userDailyCounts = {};
    data.filter(d => d.user === u).forEach(d => {
        const day = d.datetime.toISOString().slice(0, 10);
        userDailyCounts[day] = (userDailyCounts[day] || 0) + 1;
    });
    const arr = aggregateWeekly(Object.keys(userDailyCounts).sort().map(k => userDailyCounts[k]));
    const f = adaptiveSARIMA(arr, 12, seasonLength);
    userForecasts[u] = {
        '1': f.slice(0, 1).reduce((a, b) => a + b, 0),
        '4': f.slice(0, 4).reduce((a, b) => a + b, 0),
        '12': f.slice(0, 12).reduce((a, b) => a + b, 0)
    };
});

// --- Render HTML ---
const html = `
        <h2>Chat Predictions & Insights</h2>
        <div class="prediction-card">
            <h4>Most Talkative User</h4>
            <div>${topUser ? topUser[0] : 'N/A'} (${topUser ? topUser[1] : 0} msgs)</div>
        </div>
        <h3>🔮 Future Message Predictions (Weekly)</h3>
        <div class="relationship-grid">
            <div class="relationship-card">
                <h4>Group Predictions</h4>
                <div>Next Week: ${groupForecast7}</div>
                <div>Next 4 Weeks: ${groupForecast30}</div>
                <div>Next 12 Weeks: ${groupForecast90}</div>
            </div>
            ${users.map(u => `
                <div class="relationship-card">
                    <h4>${u}'s Predictions</h4>
                    <div>Next Week: ${userForecasts[u]['1']}</div>
                    <div>Next 4 Weeks: ${userForecasts[u]['4']}</div>
                    <div>Next 12 Weeks: ${userForecasts[u]['12']}</div>
                </div>
            `).join('')}
        </div>
        <div class="chart-container">
            <h3>📊 Weekly Messages: Actual vs Predicted</h3>
            <canvas id="monthlyActivityChart" width="600" height="300"></canvas>
        </div>
    `;
container.innerHTML = html;

// --- Render Chart ---
const canvas = document.getElementById('monthlyActivityChart');
if (canvas) {
    const ctx = canvas.getContext('2d');
    if (windowActivityChart) windowActivityChart.destroy();
    windowActivityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: 'Actual Messages',
                    data: chartDataActual,
                    borderColor: '#4facfe',
                    backgroundColor: 'rgba(79, 172, 254, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Predicted Messages',
                    data: chartDataForecast,
                    borderColor: '#f093fb',
                    backgroundColor: 'rgba(240, 147, 251, 0.1)',
                    borderDash: [5, 5],
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true } },
            scales: {
                x: { title: { display: true, text: 'Week Starting' } },
                y: { title: { display: true, text: 'Messages' }, beginAtZero: true }
            }
        }
    });
}
}
