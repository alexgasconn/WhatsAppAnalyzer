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

  // --- General Statistics ---
  const users = [...new Set(data.map(d => d.user))];
  const emojiList = [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let linkCount = 0;
  let totalWords = 0;
  let longestMessage = '';
  let messageTypes = { text: 0, media: 0, sticker: 0, other: 0 };

  // Per-user stats
  const wordsByUser = {};
  const linksByUser = {};
  const emojisByUser = {};
  const longestMsgByUser = {};
  const avgWordsByUser = {};

  data.forEach(d => {
    // Emojis
    let emojiCount = 0;
    for (const char of d.message) {
      if (window.emojiDictionary.hasEmoji(char)) {
        emojiList.push(char);
        emojiCount++;
      }
    }
    emojisByUser[d.user] = (emojisByUser[d.user] || 0) + emojiCount;

    // Links
    if (urlRegex.test(d.message)) {
      linkCount++;
      linksByUser[d.user] = (linksByUser[d.user] || 0) + 1;
    }

    // Longest message
    if (d.message.length > longestMessage.length) longestMessage = d.message;
    if (!longestMsgByUser[d.user] || d.message.length > longestMsgByUser[d.user].length) {
      longestMsgByUser[d.user] = d.message;
    }

    // Message types (simple heuristic)
    if (d.message === '<Media omitted>') messageTypes.media++;
    else if (d.message === '<Sticker omitted>') messageTypes.sticker++;
    else if (d.message.trim().length === 0) messageTypes.other++;
    else messageTypes.text++;

    // Words
    const wordCount = d.message.split(/\s+/).filter(Boolean).length;
    totalWords += wordCount;
    wordsByUser[d.user] = (wordsByUser[d.user] || 0) + wordCount;
    avgWordsByUser[d.user] = (avgWordsByUser[d.user] || []);
    avgWordsByUser[d.user].push(wordCount);
  });

  // Messages per day
  const messagesPerDay = {};
  data.forEach(d => {
    const day = d.datetime.toISOString().slice(0, 10);
    messagesPerDay[day] = (messagesPerDay[day] || 0) + 1;
  });
  const dayWithMostMessages = Object.entries(messagesPerDay).sort((a, b) => b[1] - a[1])[0];

  // User participation %
  const userCounts = {};
  data.forEach(d => userCounts[d.user] = (userCounts[d.user] || 0) + 1);
  const userParticipation = {};
  Object.keys(userCounts).forEach(u => {
    userParticipation[u] = ((userCounts[u] / data.length) * 100).toFixed(1);
  });

  // Average words per message
  const avgWordsPerMsg = (totalWords / data.length).toFixed(2);

  // --- General Stats HTML ---
  document.getElementById('generalStats').innerHTML = `
    <h3>General Statistics</h3>
    <ul>
      <li><strong>Total messages:</strong> ${data.length}</li>
      <li><strong>Total words:</strong> ${totalWords}</li>
      <li><strong>Total emojis:</strong> ${emojiList.length}</li>
      <li><strong>Total shared links:</strong> ${linkCount}</li>
      <li><strong>Day with most messages:</strong> ${dayWithMostMessages ? dayWithMostMessages[0] + ' (' + dayWithMostMessages[1] + ')' : '-'}</li>
      <li><strong>Average words per message:</strong> ${avgWordsPerMsg}</li>
      <li><strong>Longest message:</strong> ${longestMessage.slice(0, 100)}${longestMessage.length > 100 ? '...' : ''}</li>
      <li><strong>Message types:</strong> Text: ${messageTypes.text}, Media: ${messageTypes.media}, Stickers: ${messageTypes.sticker}, Other: ${messageTypes.other}</li>
    </ul>
  `;

  // --- Charts ---

  // 1. Bar: Messages per User
  new Chart(document.getElementById('messagesByUser'), {
    type: 'bar',
    data: {
      labels: Object.keys(userCounts),
      datasets: [{
        label: 'Messages per User',
        data: Object.values(userCounts),
        backgroundColor: 'rgba(40, 167, 69, 0.6)'
      }]
    }
  });

  // 2. Bar: Words per User
  new Chart(document.getElementById('wordsByUser'), {
    type: 'bar',
    data: {
      labels: Object.keys(wordsByUser),
      datasets: [{
        label: 'Words per User',
        data: Object.values(wordsByUser),
        backgroundColor: 'rgba(255, 99, 132, 0.6)'
      }]
    }
  });

  // 3. Bar: Most Used Emojis
  const emojiFreq = {};
  emojiList.forEach(e => emojiFreq[e] = (emojiFreq[e] || 0) + 1);
  const topEmojis = Object.entries(emojiFreq).sort((a, b) => b[1] - a[1]).slice(0, 10);
  new Chart(document.getElementById('emojiChart'), {
    type: 'bar',
    data: {
      labels: topEmojis.map(e => e[0]),
      datasets: [{
        label: 'Most Used Emojis',
        data: topEmojis.map(e => e[1]),
        backgroundColor: 'rgba(255, 193, 7, 0.6)'
      }]
    }
  });

  // 4. Bar: Most Common Words (remove stopwords)
  const stopwords = ['the', 'and', 'for', 'that', 'have', 'with', 'this', 'you', 'but', 'are', 'not', 'was', 'all', 'can', 'your', 'has', 'just', 'por', 'las', 'los', 'que', 'una', 'con', 'del', 'para', 'está', 'como', 'más', 'muy', 'pero', 'sin', 'los', 'sus', 'uno', 'una', 'unos', 'unas', 'qué', 'ese', 'esa', 'eso', 'aqui', 'allí', 'aquí', 'allá', 'porque', 'cuando', 'donde', 'quien', 'cual', 'cuales', 'sobre', 'entre', 'desde', 'hasta', 'mientras', 'durante', 'antes', 'después', 'además', 'entonces', 'también', 'solo', 'sólo', 'ya', 'sí', 'no', 'lo', 'la', 'el', 'en', 'de', 'y', 'o', 'es', 'un', 'se', 'al', 'me', 'te', 'mi', 'tu', 'si', 'le', 'les', 'nos', 'os', 'su', 'sus', 'ni', 'do', 'did', 'to', 'of', 'in', 'on', 'at', 'by', 'it', 'is', 'be', 'or', 'an', 'so', 'if', 'we', 'he', 'she', 'they', 'them', 'our', 'their', 'who', 'what', 'which', 'how', 'from', 'as', 'was', 'were', 'will', 'would', 'should', 'could', 'about', 'out', 'up', 'down', 'over', 'under', 'again', 'then', 'than', 'too', 'very', 'there', 'here', 'now', 'only', 'also', 'any', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'];
  const words = data.flatMap(d => d.message.toLowerCase().match(/\b\w{4,}\b/g) || []);
  const filteredWords = words.filter(w => !stopwords.includes(w));
  const wordFreq = {};
  filteredWords.forEach(w => wordFreq[w] = (wordFreq[w] || 0) + 1);
  const topWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 20);
  new Chart(document.getElementById('commonWordsChart'), {
    type: 'bar',
    data: {
      labels: topWords.map(e => e[0]),
      datasets: [{
        label: 'Most Common Words',
        data: topWords.map(e => e[1]),
        backgroundColor: 'rgba(54, 162, 235, 0.6)'
      }]
    }
  });

  // 5. Word Cloud
  if (window.WordCloud) {
    WordCloud(document.getElementById('wordcloud'), {
      list: Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 100),
      gridSize: 10,
      weightFactor: 3,
      fontFamily: 'Arial',
      color: 'random-dark'
    });
  } else {
    document.getElementById('wordcloud').innerHTML = '<p>WordCloud library not loaded.</p>';
  }

  // 6. Line Chart: Daily Message Count
  const days = Object.keys(messagesPerDay).sort();
  const dailyCounts = days.map(d => messagesPerDay[d]);
  new Chart(document.getElementById('dailyMessagesChart'), {
    type: 'line',
    data: {
      labels: days,
      datasets: [{
        label: 'Messages per Day',
        data: dailyCounts,
        borderColor: 'rgba(0, 123, 255, 0.8)',
        fill: false
      }]
    }
  });

  // 7. Heatmap: Activity by Hour and Weekday (grouped bar fallback)
  const heatmapData = Array.from({ length: 7 }, () => new Array(24).fill(0));
  data.forEach(d => {
    const weekday = d.datetime.getDay();
    const hour = d.datetime.getHours();
    heatmapData[weekday][hour]++;
  });
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const datasets = weekdayNames.map((day, i) => ({
    label: day,
    data: heatmapData[i],
    backgroundColor: `rgba(0,123,255,${0.2 + 0.8 * (i / 6)})`
  }));
  new Chart(document.getElementById('heatmapChart'), {
    type: 'bar',
    data: {
      labels: [...Array(24).keys()].map(h => h + ':00'),
      datasets: datasets
    },
    options: {
      plugins: { legend: { display: true } },
      title: { display: true, text: 'Activity by Hour and Weekday' },
      scales: { x: { stacked: true }, y: { stacked: true } }
    }
  });

  // 8. Bar: Messages by Day of Week
  const messagesByWeekday = new Array(7).fill(0);
  data.forEach(d => messagesByWeekday[d.datetime.getDay()]++);
  new Chart(document.getElementById('messagesByWeekday'), {
    type: 'bar',
    data: {
      labels: weekdayNames,
      datasets: [{
        label: 'Messages by Day of Week',
        data: messagesByWeekday,
        backgroundColor: 'rgba(153, 102, 255, 0.6)'
      }]
    }
  });

  // 9. Bar: Messages by Hour
  const messagesPerHour = new Array(24).fill(0);
  data.forEach(d => messagesPerHour[d.datetime.getHours()]++);
  new Chart(document.getElementById('messagesByHour'), {
    type: 'bar',
    data: {
      labels: [...Array(24).keys()].map(h => h + ':00'),
      datasets: [{
        label: 'Messages by Hour',
        data: messagesPerHour,
        backgroundColor: 'rgba(0, 123, 255, 0.6)'
      }]
    }
  });

  // --- NEW: Pie Chart for Message Types ---
  // Add <canvas id="messageTypePie"></canvas> to your HTML
  new Chart(document.getElementById('messageTypePie'), {
    type: 'pie',
    data: {
      labels: Object.keys(messageTypes),
      datasets: [{
        label: 'Message Types',
        data: Object.values(messageTypes),
        backgroundColor: [
          'rgba(40, 167, 69, 0.6)',
          'rgba(255, 193, 7, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(220, 53, 69, 0.6)'
        ]
      }]
    }
  });

  // --- NEW: Bar Chart for Average Words per Message per User ---
  // Add <canvas id="avgWordsByUser"></canvas> to your HTML
  const avgWordsUser = {};
  Object.keys(avgWordsByUser).forEach(u => {
    avgWordsUser[u] = (avgWordsByUser[u].reduce((a, b) => a + b, 0) / avgWordsByUser[u].length).toFixed(2);
  });
  new Chart(document.getElementById('avgWordsByUser'), {
    type: 'bar',
    data: {
      labels: Object.keys(avgWordsUser),
      datasets: [{
        label: 'Avg Words per Message',
        data: Object.values(avgWordsUser),
        backgroundColor: 'rgba(255, 159, 64, 0.6)'
      }]
    }
  });

  // --- NEW: Bar Chart for Longest Message per User ---
  // Add <canvas id="longestMsgByUser"></canvas> to your HTML
  const longestMsgLenByUser = {};
  Object.keys(longestMsgByUser).forEach(u => {
    longestMsgLenByUser[u] = longestMsgByUser[u].length;
  });
  new Chart(document.getElementById('longestMsgByUser'), {
    type: 'bar',
    data: {
      labels: Object.keys(longestMsgLenByUser),
      datasets: [{
        label: 'Longest Message Length',
        data: Object.values(longestMsgLenByUser),
        backgroundColor: 'rgba(54, 162, 235, 0.6)'
      }]
    }
  });

  // --- NEW: Bar Chart for Links Shared per User ---
  // Add <canvas id="linksByUser"></canvas> to your HTML
  new Chart(document.getElementById('linksByUser'), {
    type: 'bar',
    data: {
      labels: Object.keys(linksByUser),
      datasets: [{
        label: 'Links Shared',
        data: Object.values(linksByUser),
        backgroundColor: 'rgba(75, 192, 192, 0.6)'
      }]
    }
  });

  // --- NEW: Bar Chart for Emoji Usage per User ---
  // Add <canvas id="emojisByUser"></canvas> to your HTML
  new Chart(document.getElementById('emojisByUser'), {
    type: 'bar',
    data: {
      labels: Object.keys(emojisByUser),
      datasets: [{
        label: 'Emojis Used',
        data: Object.values(emojisByUser),
        backgroundColor: 'rgba(255, 205, 86, 0.6)'
      }]
    }
  });

  // --- Participation Percentage Chart ---
  new Chart(document.getElementById('userParticipation'), {
    type: 'pie',
    data: {
      labels: Object.keys(userParticipation),
      datasets: [{
        label: 'User Participation (%)',
        data: Object.values(userParticipation),
        backgroundColor: Object.keys(userParticipation).map((_, i) => `hsl(${i * 360 / Object.keys(userParticipation).length},70%,60%)`)
      }]
    }
  });

  // --- Sentiment Analysis (optional) ---
  if (window.Sentiment) {
    const sentiment = new window.Sentiment();
    let totalScore = 0;
    const sentimentByUser = {};
    const sentimentScores = [];
    data.forEach(d => {
      const result = sentiment.analyze(d.message);
      totalScore += result.score;
      sentimentScores.push(result.score);
      sentimentByUser[d.user] = (sentimentByUser[d.user] || []);
      sentimentByUser[d.user].push(result.score);
    });
    const avgSentiment = (totalScore / data.length).toFixed(2);

    document.getElementById('sentimentStats').innerHTML = `
      <h3>Sentiment Analysis</h3>
      <p><strong>Overall average sentiment:</strong> ${avgSentiment}</p>
    `;

    // Sentiment per user
    const sentimentUserAvg = {};
    Object.keys(sentimentByUser).forEach(u => {
      const arr = sentimentByUser[u];
      sentimentUserAvg[u] = (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
    });
    new Chart(document.getElementById('sentimentByUser'), {
      type: 'bar',
      data: {
        labels: Object.keys(sentimentUserAvg),
        datasets: [{
          label: 'Average Sentiment per User',
          data: Object.values(sentimentUserAvg),
          backgroundColor: 'rgba(255, 206, 86, 0.6)'
        }]
      }
    });

    // Sentiment histogram
    const hist = {};
    sentimentScores.forEach(s => {
      const key = Math.round(s);
      hist[key] = (hist[key] || 0) + 1;
    });
    new Chart(document.getElementById('sentimentHistogram'), {
      type: 'bar',
      data: {
        labels: Object.keys(hist),
        datasets: [{
          label: 'Sentiment Score Histogram',
          data: Object.values(hist),
          backgroundColor: 'rgba(75, 192, 192, 0.6)'
        }]
      }
    });
  }

  // --- Games & Extras ---
  // Fix: Who uses more emojis?
  let maxEmojiUser = Object.entries(emojisByUser).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
  document.getElementById('gamesExtras').innerHTML = `
    <h3>Games & Extras</h3>
    <ul>
      <li><strong>Who wrote more?</strong> ${Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0][0]}</li>
      <li><strong>Who uses more emojis?</strong> ${maxEmojiUser}</li>
      <li><strong>Longest message:</strong> ${longestMessage.slice(0, 100)}${longestMessage.length > 100 ? '...' : ''}</li>
      <li><strong>Message types:</strong> Text: ${messageTypes.text}, Media: ${messageTypes.media}, Stickers: ${messageTypes.sticker}, Other: ${messageTypes.other}</li>
    </ul>
  `;
}
