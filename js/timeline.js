// Análisis de Línea Temporal - Por Día, Semana, Mes y Año

function generateTimeline(data) {
    if (data.length === 0) {
        document.getElementById('timeline').innerHTML = '<p class="error-message">Sin datos disponibles</p>';
        return;
    }

    const content = document.getElementById('timeline');
    content.innerHTML = '';

    // Tabs para diferentes períodos
    const tabsHTML = `
    <div style="margin-bottom: 20px; border-bottom: 2px solid var(--border);">
      <button class="timeline-tab active" data-period="day">📅 Por Día</button>
      <button class="timeline-tab" data-period="week">🗓️ Por Semana</button>
      <button class="timeline-tab" data-period="month">📆 Por Mes</button>
      <button class="timeline-tab" data-period="year">📊 Por Año</button>
    </div>
    <div id="timelineContent"></div>
  `;

    content.innerHTML = tabsHTML;

    // Event listeners para tabs
    content.querySelectorAll('.timeline-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            content.querySelectorAll('.timeline-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');

            const period = e.target.dataset.period;
            const timelineContent = document.getElementById('timelineContent');

            switch (period) {
                case 'day':
                    renderDailyTimeline(data, timelineContent);
                    break;
                case 'week':
                    renderWeeklyTimeline(data, timelineContent);
                    break;
                case 'month':
                    renderMonthlyTimeline(data, timelineContent);
                    break;
                case 'year':
                    renderYearlyTimeline(data, timelineContent);
                    break;
            }
        });
    });

    // Render inicial
    const timelineContent = document.getElementById('timelineContent');
    renderDailyTimeline(data, timelineContent);
}

function renderDailyTimeline(data, container) {
    const dailyStats = new Map();

    data.forEach(msg => {
        const date = msg.datetime.toLocaleDateString('es-ES');
        if (!dailyStats.has(date)) {
            dailyStats.set(date, {
                messages: 0,
                users: new Set(),
                hours: new Map(),
                words: 0
            });
        }

        const stats = dailyStats.get(date);
        stats.messages++;
        stats.users.add(msg.user);
        const hour = msg.datetime.getHours();
        stats.hours.set(hour, (stats.hours.get(hour) || 0) + 1);
        stats.words += msg.message.split(' ').length;
    });

    const sortedDates = Array.from(dailyStats.entries()).sort();

    let html = '<div class="chart-container"><h3>📊 Actividad Diaria</h3><div style="height: 300px;"><canvas id="dailyChart"></canvas></div></div>';

    html += '<div class="stats-grid">';
    sortedDates.slice(-7).forEach(([date, stats]) => {
        html += `
      <div class="stat-card">
        <h3>${date}</h3>
        <div class="value">${stats.messages}</div>
        <div class="label">mensajes</div>
        <div style="font-size: 0.9em; margin-top: 8px; opacity: 0.8;">
          👥 ${stats.users.size} | 📝 ${stats.words} palabras
        </div>
      </div>
    `;
    });
    html += '</div>';

    container.innerHTML = html;

    // Gráfico de los últimos 30 días
    const last30Days = sortedDates.slice(-30);
    const labels = last30Days.map(([date]) => date.substring(0, 5));
    const messages = last30Days.map(([_, stats]) => stats.messages);

    const ctx = container.querySelector('#dailyChart');
    if (ctx) {
        createChart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Mensajes por Día',
                    data: messages,
                    borderColor: '#25D366',
                    backgroundColor: 'rgba(37, 211, 102, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#25D366',
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Mensajes' }
                    }
                }
            }
        });
    }
}

function renderWeeklyTimeline(data, container) {
    const weeklyStats = new Map();

    data.forEach(msg => {
        const date = new Date(msg.datetime);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toLocaleDateString('es-ES');

        if (!weeklyStats.has(weekKey)) {
            weeklyStats.set(weekKey, {
                messages: 0,
                users: new Set(),
                avgPerDay: 0,
                days: 0
            });
        }

        const stats = weeklyStats.get(weekKey);
        stats.messages++;
        stats.users.add(msg.user);
    });

    const sortedWeeks = Array.from(weeklyStats.entries()).sort();

    sortedWeeks.forEach(([_, stats]) => {
        stats.days = Math.ceil(stats.messages / (stats.messages / sortedWeeks.length || 1));
        stats.avgPerDay = Math.round(stats.messages / 7);
    });

    let html = '<div class="chart-container"><h3>📈 Actividad Semanal</h3><div style="height: 300px;"><canvas id="weeklyChart"></canvas></div></div>';

    html += '<div class="relationship-grid">';
    sortedWeeks.forEach(([week, stats]) => {
        html += `
      <div class="relationship-card">
        <h4>Semana del ${week}</h4>
        <div class="relationship-item">
          <span class="relationship-label">Total Mensajes:</span>
          <span class="relationship-value">${stats.messages}</span>
        </div>
        <div class="relationship-item">
          <span class="relationship-label">Usuarios Activos:</span>
          <span class="relationship-value">${stats.users.size}</span>
        </div>
        <div class="relationship-item">
          <span class="relationship-label">Promedio/Día:</span>
          <span class="relationship-value">${stats.avgPerDay}</span>
        </div>
      </div>
    `;
    });
    html += '</div>';

    container.innerHTML = html;

    const labels = sortedWeeks.map(([week]) => 'Sem ' + week.substring(0, 5));
    const messages = sortedWeeks.map(([_, stats]) => stats.messages);

    const ctx = container.querySelector('#weeklyChart');
    if (ctx) {
        createChart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Mensajes por Semana',
                    data: messages,
                    backgroundColor: [
                        'rgba(37, 211, 102, 0.8)',
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(118, 75, 162, 0.8)',
                        'rgba(79, 172, 254, 0.8)'
                    ].slice(0, labels.length),
                    borderColor: [
                        '#25D366',
                        '#667eea',
                        '#764ba2',
                        '#4facfe'
                    ].slice(0, labels.length),
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'x',
                plugins: { legend: { display: true } },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

function renderMonthlyTimeline(data, container) {
    const monthlyStats = new Map();

    data.forEach(msg => {
        const date = msg.datetime;
        const monthKey = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });

        if (!monthlyStats.has(monthKey)) {
            monthlyStats.set(monthKey, {
                messages: 0,
                users: new Set(),
                days: new Set(),
                growth: 0
            });
        }

        const stats = monthlyStats.get(monthKey);
        stats.messages++;
        stats.users.add(msg.user);
        stats.days.add(date.getDate());
    });

    const sortedMonths = Array.from(monthlyStats.entries()).sort();

    let html = '<div class="chart-container"><h3>📊 Actividad Mensual</h3><div style="height: 300px;"><canvas id="monthlyChart"></canvas></div></div>';

    html += '<div class="prediction-card" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);"><h4>📈 Análisis Mensual</h4>';
    sortedMonths.forEach(([month, stats], idx) => {
        const prevStats = idx > 0 ? sortedMonths[idx - 1][1] : null;
        const growth = prevStats ? Math.round(((stats.messages - prevStats.messages) / prevStats.messages) * 100) : 0;

        html += `
      <div style="margin: 15px 0; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px;">
        <strong>${month}</strong>: ${stats.messages} msgs | ${stats.users.size} users | ${stats.days.size} días
        ${growth > 0 ? `<span style="color: #43e97b;"> ↑ +${growth}%</span>` : growth < 0 ? `<span style="color: #f5576c;"> ↓ ${growth}%</span>` : ''}
      </div>
    `;
    });
    html += '</div>';

    container.innerHTML = html;

    const labels = sortedMonths.map(([month]) => month.substring(0, 3));
    const messages = sortedMonths.map(([_, stats]) => stats.messages);
    const users = sortedMonths.map(([_, stats]) => stats.users.size);

    const ctx = container.querySelector('#monthlyChart');
    if (ctx) {
        createChart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Mensajes',
                        data: messages,
                        backgroundColor: 'rgba(37, 211, 102, 0.8)',
                        borderColor: '#25D366',
                        borderWidth: 2
                    },
                    {
                        label: 'Usuarios Activos',
                        data: users,
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: '#667eea',
                        borderWidth: 2
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
    }
}

function renderYearlyTimeline(data, container) {
    const yearlyStats = new Map();

    data.forEach(msg => {
        const year = msg.datetime.getFullYear();
        if (!yearlyStats.has(year)) {
            yearlyStats.set(year, {
                messages: 0,
                users: new Set(),
                months: new Set()
            });
        }

        const stats = yearlyStats.get(year);
        stats.messages++;
        stats.users.add(msg.user);
        stats.months.add(msg.datetime.getMonth());
    });

    const sortedYears = Array.from(yearlyStats.entries()).sort();

    let html = '<div class="chart-container"><h3>📊 Actividad Anual</h3>';

    if (sortedYears.length > 0) {
        html += '<div style="height: 300px;"><canvas id="yearlyChart"></canvas></div>';
    }

    html += '</div>';

    html += '<div class="stats-grid">';
    sortedYears.forEach(([year, stats]) => {
        html += `
      <div class="stat-card">
        <h3>${year}</h3>
        <div class="value">${stats.messages}</div>
        <div class="label">mensajes totales</div>
        <div style="font-size: 0.9em; margin-top: 8px; opacity: 0.8;">
          👥 ${stats.users.size} usuarios | 📅 ${stats.months.size} meses
        </div>
      </div>
    `;
    });
    html += '</div>';

    container.innerHTML = html;

    const labels = sortedYears.map(([year]) => year.toString());
    const messages = sortedYears.map(([_, stats]) => stats.messages);

    const ctx = container.querySelector('#yearlyChart');
    if (ctx && sortedYears.length > 0) {
        createChart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Mensajes por Año',
                    data: messages,
                    backgroundColor: 'rgba(37, 211, 102, 0.8)',
                    borderColor: '#25D366',
                    borderWidth: 2,
                    borderRadius: 8
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
}

// Estilos para timeline tabs
const style = document.createElement('style');
style.textContent = `
  .timeline-tab {
    padding: 12px 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-weight: 600;
    color: var(--text);
    transition: all 0.3s;
    border-bottom: 3px solid transparent;
    font-size: 0.9em;
  }
  
  .timeline-tab:hover {
    color: var(--primary);
    background: rgba(37, 211, 102, 0.05);
  }
  
  .timeline-tab.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
  }
`;
document.head.appendChild(style);
