document.getElementById('fileInput').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    analyzeChat(text);
  };
  reader.readAsText(file);
});

function analyzeChat(text) {
  const lines = text.split('\n');
  const pattern = /^(\d{1,2}\/\d{1,2}\/\d{2,4}), (\d{1,2}:\d{2}) - ([^:]+): (.*)$/;
  const data = [];

  lines.forEach(line => {
    const match = line.match(pattern);
    if (match) {
      const [_, date, time, user, message] = match;
      const dateObj = new Date(date.split('/').reverse().join('-') + 'T' + time);
      data.push({ datetime: dateObj, user, message });
    }
  });

  if (data.length === 0) {
    document.getElementById('summary').innerHTML = '<p>No se pudieron procesar mensajes.</p>';
    return;
  }

  const summary = {
    totalMessages: data.length,
    users: [...new Set(data.map(d => d.user))],
    wordCount: data.reduce((acc, msg) => acc + msg.message.split(/\s+/).length, 0),
  };

  const summaryHTML = `
    <h2>📊 Estadísticas</h2>
    <p><strong>Total mensajes:</strong> ${summary.totalMessages}</p>
    <p><strong>Total palabras:</strong> ${summary.wordCount}</p>
    <p><strong>Usuarios:</strong> ${summary.users.join(', ')}</p>
  `;
  document.getElementById('summary').innerHTML = summaryHTML;

  // Aquí irían los módulos de charts, sentiment, juegos, etc.
}
