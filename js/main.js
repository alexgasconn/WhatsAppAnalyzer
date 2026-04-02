// ===== VARIABLES GLOBALES =====
let chartInstances = [];
let originalRawData = null;
let globalData = null;
let currentActiveTab = 'overview';
let currentTheme = localStorage.getItem('theme') || 'light';

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  setupEventListeners();
  showTab('overview');
});

// ===== TEMA (DARK MODE) =====
function initializeTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.textContent = currentTheme === 'light' ? '🌙' : '☀️';
  }
}

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', currentTheme);
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon();
  if (globalData && chartInstances.length > 0) {
    destroyCharts();
    renderTabContent(currentActiveTab, globalData);
  }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.addEventListener('change', handleFileUpload);

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentActiveTab = e.target.dataset.tab;
      showTab(currentActiveTab);
    });
  });

  document.getElementById('applyDateFilter')?.addEventListener('click', applyDateFilter);
  document.getElementById('clearDateFilter')?.addEventListener('click', clearDateFilter);
  document.getElementById('periodFilter')?.addEventListener('change', handlePeriodFilter);

  // Exportación
  document.getElementById('exportJSON')?.addEventListener('click', () => exportData('json'));
  document.getElementById('exportCSV')?.addEventListener('click', () => exportData('csv'));
  document.getElementById('exportImage')?.addEventListener('click', exportCurrentChart);
  document.getElementById('shareBrowser')?.addEventListener('click', shareResults);
}

// ===== MANEJO DE ARCHIVO =====
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  document.getElementById('fileName').textContent = `✓ Cargado: ${file.name}`;
  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      parseChatFile(event.target.result);
      document.getElementById('dateFilterSection').style.display = 'flex';
      document.getElementById('exportControls').style.display = 'flex';
    } catch (error) {
      showError('Error analizando el chat: ' + error.message);
    }
  };

  reader.onerror = () => showError('Error leyendo el archivo');
  reader.readAsText(file);
}

// ===== PARSEAR CHAT =====
function parseChatFile(text) {
  destroyCharts();
  const lines = text.split('\n');
  const pattern = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s(\d{1,2}:\d{2})\s-\s([^:]+):\s(.*)$/;
  const data = [];
  let currentMessage = null;

  lines.forEach(line => {
    const match = line.match(pattern);
    if (match) {
      if (currentMessage) data.push(currentMessage);

      const [_, date, time, user, message] = match;
      const parts = date.split('/');
      let year = parseInt(parts[2]);
      // Arreglar años de 2 dígitos: 25 → 2025, 99 → 2099, 00 → 2000
      if (year < 100) {
        year = year < 50 ? year + 2000 : year + 1900;
      }
      const dateObj = new Date(year, parseInt(parts[1]) - 1, parseInt(parts[0]));
      const [hours, minutes] = time.split(':').map(Number);
      dateObj.setHours(hours, minutes, 0, 0);

      currentMessage = {
        datetime: dateObj,
        user: user.trim(),
        message: message.trim()
      };
    } else if (currentMessage) {
      currentMessage.message += '\n' + line.trim();
    }
  });

  if (currentMessage) data.push(currentMessage);

  if (data.length === 0) {
    showError('Sin mensajes encontrados. Verifica el formato: "DD/MM/YYYY, HH:MM - Usuario: Mensaje"');
    return;
  }

  originalRawData = data;
  globalData = data;

  const minDate = new Date(Math.min(...data.map(d => d.datetime)));
  const maxDate = new Date(Math.max(...data.map(d => d.datetime)));

  document.getElementById('startDate').valueAsDate = minDate;
  document.getElementById('endDate').valueAsDate = maxDate;

  showTab(currentActiveTab);
}

// ===== FILTROS =====
function applyDateFilter() {
  if (!originalRawData) return;

  const startDate = document.getElementById('startDate').valueAsDate;
  const endDate = document.getElementById('endDate').valueAsDate;

  if (!startDate || !endDate) {
    alert('Selecciona ambas fechas');
    return;
  }

  const filterStart = new Date(startDate.setHours(0, 0, 0, 0));
  const filterEnd = new Date(endDate.setHours(23, 59, 59, 999));

  globalData = originalRawData.filter(d => d.datetime >= filterStart && d.datetime <= filterEnd);

  if (globalData.length === 0) {
    showError('Sin mensajes en el rango seleccionado');
    globalData = [];
  } else {
    showTab(currentActiveTab);
  }
}

function handlePeriodFilter() {
  if (!originalRawData) return;

  const period = document.getElementById('periodFilter').value;
  const now = new Date();
  let startDate = new Date(now);

  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      if (originalRawData.length > 0) {
        startDate = new Date(Math.min(...originalRawData.map(d => d.datetime)));
      }
  }

  document.getElementById('startDate').valueAsDate = startDate;
  document.getElementById('endDate').valueAsDate = now;
  applyDateFilter();
}

function clearDateFilter() {
  if (!originalRawData) return;

  const minDate = new Date(Math.min(...originalRawData.map(d => d.datetime)));
  const maxDate = new Date(Math.max(...originalRawData.map(d => d.datetime)));

  document.getElementById('startDate').valueAsDate = minDate;
  document.getElementById('endDate').valueAsDate = maxDate;
  document.getElementById('periodFilter').value = 'all';

  globalData = originalRawData;
  showTab(currentActiveTab);
}

// ===== TABS =====
function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(div => div.style.display = 'none');
  const activeContent = document.getElementById(tabName);
  if (activeContent) activeContent.style.display = 'block';

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  if (globalData) {
    destroyCharts();
    setTimeout(() => {
      renderTabContent(tabName, globalData);
    }, 50);
  }
}

function renderTabContent(tabName, data) {
  switch (tabName) {
    case 'overview': generateOverview(data); break;
    case 'activity': generateActivity(data); break;
    case 'users': generateUsers(data); break;
    case 'timeline': generateTimeline(data); break;
    case 'relationships': generateRelationships(data); break;
    case 'predictions': generatePredictions(data); break;
    case 'content': generateContent(data); break;
    case 'game': initializeGame(data); break;
  }
}

// ===== GRÁFICOS =====
function destroyCharts() {
  chartInstances.forEach(chart => {
    if (chart && chart.destroy) {
      chart.destroy();
    }
  });
  chartInstances = [];
}

function createChart(ctx, config) {
  try {
    const chart = new Chart(ctx, config);
    chartInstances.push(chart);
    return chart;
  } catch (error) {
    console.error('Error creating chart:', error);
    return null;
  }
}

// ===== UTILIDADES =====
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  const uploadSection = document.querySelector('.upload-section');
  if (uploadSection) {
    uploadSection.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }
}

// ===== EXPORTACIÓN =====
function exportData(format) {
  if (!globalData || globalData.length === 0) {
    alert('Sin datos para exportar');
    return;
  }

  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === 'json') {
    const json = JSON.stringify(globalData, null, 2);
    downloadFile(json, `whatsapp-analysis-${timestamp}.json`, 'application/json');
  } else if (format === 'csv') {
    const csv = generateCSV(globalData);
    downloadFile(csv, `whatsapp-analysis-${timestamp}.csv`, 'text/csv');
  }
}

function generateCSV(data) {
  const headers = ['Fecha', 'Hora', 'Usuario', 'Mensaje'];
  const rows = data.map(row => [
    row.datetime.toLocaleDateString('es-ES'),
    row.datetime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    `"${row.user}"`,
    `"${row.message.replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportCurrentChart() {
  const activeTab = document.querySelector('.tab-content[style*="display: block"]');
  if (!activeTab) return;

  const canvas = activeTab.querySelector('canvas');
  if (!canvas) {
    alert('No hay gráfico para exportar');
    return;
  }

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `chart-${new Date().toISOString().slice(0, 10)}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ===== COMPARTIR =====
function shareResults() {
  if (!globalData || globalData.length === 0) {
    alert('Sin datos para compartir');
    return;
  }

  const stats = {
    totalMensajes: globalData.length,
    totalUsuarios: new Set(globalData.map(m => m.user)).size,
    rango: `${globalData[0].datetime.toLocaleDateString('es-ES')} - ${globalData[globalData.length - 1].datetime.toLocaleDateString('es-ES')}`
  };

  const text = `Análisis Chat WhatsApp: ${stats.totalMensajes} mensajes, ${stats.totalUsuarios} usuarios, ${stats.rango}`;

  if (navigator.share) {
    navigator.share({
      title: 'WhatsApp Chat Analysis',
      text: text,
      url: window.location.href
    }).catch(err => console.log('Error compartiendo:', err));
  } else {
    navigator.clipboard.writeText(text).then(() => {
      alert('Estadísticas copiadas al portapapeles');
    });
  }
}

// ===== FUNCIONES TAB (STUBS) =====
// ===== STUBS: Llaman a funciones en archivos separados =====
// Nota: Las funciones reales se definen en sus respectivos archivos
// (overview.js, activity.js, timeline.js, etc.) y se cargan después de main.js
// Estos stubs actúan como puntos de entrada en renderTabContent()

// ===== UTILIDADES HELPER =====
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}