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

  const users = [...new Set(data.map(d => d.user))];
  const wordCount = data.reduce((acc, msg) => acc + msg.message.split(/\s+/).length, 0);

  document.getElementById('summary').innerHTML = `
    <h2>📊 Estadísticas</h2>
    <p><strong>Total mensajes:</strong> ${data.length}</p>
    <p><strong>Total palabras:</strong> ${wordCount}</p>
    <p><strong>Usuarios:</strong> ${users.join(', ')}</p>
  `;

  // Mensajes por hora
  const messagesPerHour = new Array(24).fill(0);
  data.forEach(d => messagesPerHour[d.datetime.getHours()]++);

  new Chart(document.getElementById('messagesByHour'), {
    type: 'bar',
    data: {
      labels: [...Array(24).keys()].map(h => h + ':00'),
      datasets: [{
        label: 'Mensajes por hora',
        data: messagesPerHour,
        backgroundColor: 'rgba(0, 123, 255, 0.6)'
      }]
    }
  });

  // Mensajes por usuario
  const userCounts = {};
  data.forEach(d => userCounts[d.user] = (userCounts[d.user] || 0) + 1);
  new Chart(document.getElementById('messagesByUser'), {
    type: 'bar',
    data: {
      labels: Object.keys(userCounts),
      datasets: [{
        label: 'Mensajes por usuario',
        data: Object.values(userCounts),
        backgroundColor: 'rgba(40, 167, 69, 0.6)'
      }]
    }
  });

  // Emojis
  const emojiList = [];
  data.forEach(d => {
    for (const char of d.message) {
      if (window.emojiDictionary.hasEmoji(char)) emojiList.push(char);
    }
  });

  const emojiFreq = {};
  emojiList.forEach(e => emojiFreq[e] = (emojiFreq[e] || 0) + 1);
  const topEmojis = Object.entries(emojiFreq).sort((a,b) => b[1] - a[1]).slice(0, 10);

  new Chart(document.getElementById('emojiChart'), {
    type: 'bar',
    data: {
      labels: topEmojis.map(e => e[0]),
      datasets: [{
        label: 'Emojis más usados',
        data: topEmojis.map(e => e[1]),
        backgroundColor: 'rgba(255, 193, 7, 0.6)'
      }]
    }
  });

  // Wordcloud
  const words = data.flatMap(d => d.message.toLowerCase().match(/\b\w{4,}\b/g) || []);
  const wordFreq = {};
  words.forEach(w => wordFreq[w] = (wordFreq[w] || 0) + 1);
  const topWords = Object.entries(wordFreq).sort((a,b) => b[1] - a[1]).slice(0, 100);
  WordCloud(document.getElementById('wordcloud'), {
    list: topWords,
    gridSize: 10,
    weightFactor: 3,
    fontFamily: 'Arial',
    color: 'random-dark'
  });
}
