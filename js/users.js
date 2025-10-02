/**
 * Generates comprehensive user statistics with dropdown selector and advanced metrics.
 * @param {Array} data The parsed chat data.
 */
function generateUsers(data) {
  const userStats = {};
  const now = new Date();

  // Precompute all message stats per user
  data.forEach((d, idx) => {
    if (!userStats[d.user]) {
      userStats[d.user] = {
        messages: 0,
        words: 0,
        chars: 0,
        avgLength: [],
        emojis: 0,
        lastMessage: d,
        firstMessage: d,
        timestamps: [],
        responseTimes: [],
        hourHist: Array(24).fill(0),
        dayOfWeekHist: Array(7).fill(0),
        monthlyActivity: {},
        dailyMessages: {},
        streaks: [],
        currentStreak: 0,
        longestStreak: 0,
        links: 0,
        questions: 0,
        exclamations: 0,
        capsMessages: 0,
        mediaShared: 0,
        deletedMessages: 0
      };
    }
    
    const u = userStats[d.user];
    u.messages++;
    
    const words = d.message.split(/\s+/).filter(Boolean).length;
    u.words += words;
    u.chars += d.message.length;
    u.avgLength.push(d.message.length);

    // Timestamps and date analysis
    const dt = new Date(d.datetime);
    if (d.datetime > u.lastMessage.datetime) u.lastMessage = d;
    if (d.datetime < u.firstMessage.datetime) u.firstMessage = d;
    
    u.timestamps.push(d.datetime);
    u.hourHist[dt.getHours()]++;
    u.dayOfWeekHist[dt.getDay()]++;
    
    // Monthly activity
    const monthKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    u.monthlyActivity[monthKey] = (u.monthlyActivity[monthKey] || 0) + 1;
    
    // Daily messages
    const dateKey = dt.toISOString().split('T')[0];
    u.dailyMessages[dateKey] = (u.dailyMessages[dateKey] || 0) + 1;

    // Content analysis
    if (window.emojiDictionary) {
      for (const char of d.message) {
        if (window.emojiDictionary.getName(char)) {
          u.emojis++;
        }
      }
    }
    
    // Links
    if (/(https?:\/\/[^\s]+)/gi.test(d.message)) u.links++;
    
    // Questions and exclamations
    if (d.message.includes('?')) u.questions++;
    if (d.message.includes('!')) u.exclamations++;
    
    // CAPS detection (>70% uppercase letters)
    const letters = d.message.replace(/[^a-zA-Z]/g, '');
    if (letters.length > 5) {
      const upperCount = (d.message.match(/[A-Z]/g) || []).length;
      if (upperCount / letters.length > 0.7) u.capsMessages++;
    }
    
    // Media and deleted
    if (/<Media omitido>|<archivo adjunto>|image omitted|video omitted/i.test(d.message)) {
      u.mediaShared++;
    }
    if (/eliminaste este mensaje|deleted this message/i.test(d.message)) {
      u.deletedMessages++;
    }

    // Response time calculation
    if (idx > 0 && data[idx - 1].user !== d.user) {
      const timeDiff = (new Date(d.datetime) - new Date(data[idx - 1].datetime)) / 1000;
      if (timeDiff < 3600) { // Only count if < 1 hour
        u.responseTimes.push(timeDiff);
      }
    }
  });

  // Calculate streaks and derived stats
  Object.keys(userStats).forEach(user => {
    const u = userStats[user];
    
    // Days active and average per day
    const daysActive = Math.max(1, (now - new Date(u.firstMessage.datetime)) / (1000*60*60*24));
    u.daysActive = Math.round(daysActive);
    u.avgPerDay = (u.messages / daysActive).toFixed(2);
    u.avgMsgLength = (u.chars / u.messages).toFixed(1);
    u.avgWordsPerMsg = (u.words / u.messages).toFixed(1);
    
    // Average response time
    if (u.responseTimes.length > 0) {
      const avgResponse = u.responseTimes.reduce((a, b) => a + b, 0) / u.responseTimes.length;
      u.avgResponseTime = avgResponse < 60 
        ? `${avgResponse.toFixed(0)}s` 
        : `${(avgResponse / 60).toFixed(1)}min`;
    } else {
      u.avgResponseTime = 'N/A';
    }
    
    // Calculate streaks
    const sortedDates = Object.keys(u.dailyMessages).sort();
    let streak = 1;
    let maxStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.round((currDate - prevDate) / (1000*60*60*24));
      
      if (diffDays === 1) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 1;
      }
    }
    
    // Check current streak
    if (sortedDates.length > 0) {
      const lastDate = new Date(sortedDates[sortedDates.length - 1]);
      const daysSinceLastMsg = Math.round((now - lastDate) / (1000*60*60*24));
      u.currentStreak = daysSinceLastMsg <= 1 ? streak : 0;
    }
    
    u.longestStreak = maxStreak;
    
    // Find most active day
    const maxMessages = Math.max(...Object.values(u.dailyMessages));
    u.busiestDay = Object.keys(u.dailyMessages).find(k => u.dailyMessages[k] === maxMessages);
    u.busiestDayCount = maxMessages;
    
    // Most active hour
    u.mostActiveHour = u.hourHist.indexOf(Math.max(...u.hourHist));
    
    // Most active day of week
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    u.mostActiveDayOfWeek = daysOfWeek[u.dayOfWeekHist.indexOf(Math.max(...u.dayOfWeekHist))];
    
    // Participation percentage
    u.participationPct = ((u.messages / data.length) * 100).toFixed(1);
  });

  // Create dropdown and container
  const users = Object.keys(userStats).sort();
  
  let html = `
    <div class="user-selector-container">
      <label for="userDropdown" class="user-selector-label">
        <span class="label-icon">👤</span>
        Seleccionar Usuario:
      </label>
      <select id="userDropdown" class="user-dropdown">
        ${users.map(user => `<option value="${user}">${user}</option>`).join('')}
      </select>
    </div>
    <div id="selectedUserStats" class="selected-user-stats"></div>
  `;

  document.getElementById('users').innerHTML = html;

  // Function to render selected user stats
  function renderUserStats(selectedUser) {
    const u = userStats[selectedUser];
    const cardId = selectedUser.replace(/\W+/g, "_");
    
    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    const statsHtml = `
      <div class="user-detail-card">
        <div class="user-header">
          <h2 class="user-name">${selectedUser}</h2>
          <span class="participation-badge">${u.participationPct}% del chat</span>
        </div>

        <div class="stats-grid">
          <!-- Mensajes y Actividad -->
          <div class="stat-section">
            <h3 class="section-title">📊 Mensajes y Actividad</h3>
            <div class="stat-row">
              <span class="stat-label">Total de mensajes:</span>
              <span class="stat-value">${u.messages.toLocaleString()}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Palabras totales:</span>
              <span class="stat-value">${u.words.toLocaleString()}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Caracteres totales:</span>
              <span class="stat-value">${u.chars.toLocaleString()}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Promedio palabras/mensaje:</span>
              <span class="stat-value">${u.avgWordsPerMsg}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Promedio caracteres/mensaje:</span>
              <span class="stat-value">${u.avgMsgLength}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Mensajes por día:</span>
              <span class="stat-value">${u.avgPerDay}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Días activo:</span>
              <span class="stat-value">${u.daysActive}</span>
            </div>
          </div>

          <!-- Rachas -->
          <div class="stat-section">
            <h3 class="section-title">🔥 Rachas</h3>
            <div class="stat-row highlight">
              <span class="stat-label">Racha actual:</span>
              <span class="stat-value">${u.currentStreak} días</span>
            </div>
            <div class="stat-row highlight">
              <span class="stat-label">Racha más larga:</span>
              <span class="stat-value">${u.longestStreak} días</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Día más activo:</span>
              <span class="stat-value">${new Date(u.busiestDay).toLocaleDateString()}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Mensajes ese día:</span>
              <span class="stat-value">${u.busiestDayCount}</span>
            </div>
          </div>

          <!-- Patrones de Tiempo -->
          <div class="stat-section">
            <h3 class="section-title">⏰ Patrones de Tiempo</h3>
            <div class="stat-row">
              <span class="stat-label">Hora más activa:</span>
              <span class="stat-value">${u.mostActiveHour}:00</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Día más activo:</span>
              <span class="stat-value">${u.mostActiveDayOfWeek}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Tiempo de respuesta promedio:</span>
              <span class="stat-value">${u.avgResponseTime}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Primer mensaje:</span>
              <span class="stat-value">${new Date(u.firstMessage.datetime).toLocaleDateString()}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Último mensaje:</span>
              <span class="stat-value">${new Date(u.lastMessage.datetime).toLocaleDateString()}</span>
            </div>
          </div>

          <!-- Contenido -->
          <div class="stat-section">
            <h3 class="section-title">💬 Contenido</h3>
            <div class="stat-row">
              <span class="stat-label">Emojis usados:</span>
              <span class="stat-value">${u.emojis.toLocaleString()}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Enlaces compartidos:</span>
              <span class="stat-value">${u.links}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Preguntas (?):</span>
              <span class="stat-value">${u.questions}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Exclamaciones (!):</span>
              <span class="stat-value">${u.exclamations}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Mensajes en MAYÚSCULAS:</span>
              <span class="stat-value">${u.capsMessages}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Multimedia compartido:</span>
              <span class="stat-value">${u.mediaShared}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Mensajes eliminados:</span>
              <span class="stat-value">${u.deletedMessages}</span>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="charts-container">
          <div class="chart-box">
            <h4 class="chart-title">Mensajes por Hora del Día</h4>
            <canvas id="hours_${cardId}"></canvas>
          </div>
          
          <div class="chart-box">
            <h4 class="chart-title">Mensajes por Día de la Semana</h4>
            <canvas id="dayofweek_${cardId}"></canvas>
          </div>
          
          <div class="chart-box full-width">
            <h4 class="chart-title">Actividad Mensual</h4>
            <canvas id="monthly_${cardId}"></canvas>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('selectedUserStats').innerHTML = statsHtml;
    
    // Clear previous chart instances for this user
    chartInstances.forEach(chart => chart.destroy());
    chartInstances.length = 0;
    
    // Hour histogram
    const ctxHours = document.getElementById(`hours_${cardId}`).getContext('2d');
    chartInstances.push(new Chart(ctxHours, {
      type: 'bar',
      data: {
        labels: Array.from({length: 24}, (_, i) => `${i}:00`),
        datasets: [{
          label: 'Mensajes',
          data: u.hourHist,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true },
          x: { ticks: { maxRotation: 45, minRotation: 45 } }
        }
      }
    }));
    
    // Day of week histogram
    const ctxDay = document.getElementById(`dayofweek_${cardId}`).getContext('2d');
    chartInstances.push(new Chart(ctxDay, {
      type: 'bar',
      data: {
        labels: daysOfWeek,
        datasets: [{
          label: 'Mensajes',
          data: u.dayOfWeekHist,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    }));
    
    // Monthly activity
    const monthlyLabels = Object.keys(u.monthlyActivity).sort();
    const monthlyData = monthlyLabels.map(m => u.monthlyActivity[m]);
    
    const ctxMonthly = document.getElementById(`monthly_${cardId}`).getContext('2d');
    chartInstances.push(new Chart(ctxMonthly, {
      type: 'line',
      data: {
        labels: monthlyLabels,
        datasets: [{
          label: 'Mensajes por mes',
          data: monthlyData,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    }));
  }

  // Initial render
  renderUserStats(users[0]);

  // Dropdown change event
  document.getElementById('userDropdown').addEventListener('change', (e) => {
    renderUserStats(e.target.value);
  });
}

// Additional CSS styles (add to your existing styles)
const additionalStyles = `
.user-selector-container {
  margin: 20px 0;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.user-selector-label {
  display: block;
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
}

.label-icon {
  margin-right: 8px;
  font-size: 20px;
}

.user-dropdown {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.user-dropdown:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.user-detail-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  margin-top: 20px;
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.user-name {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.participation-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  border-left: 4px solid #667eea;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0 0 15px 0;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e0e0e0;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-row.highlight {
  background: linear-gradient(90deg, rgba(102,126,234,0.1) 0%, transparent 100%);
  padding: 10px;
  border-radius: 6px;
  border-bottom: none;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-weight: 500;
}

.stat-value {
  color: #333;
  font-weight: 700;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-box {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  height: 350px;
}

.chart-box.full-width {
  grid-column: 1 / -1;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 15px 0;
  text-align: center;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .chart-box.full-width {
    grid-column: 1;
  }
}
`;