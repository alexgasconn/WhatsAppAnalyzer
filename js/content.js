/**
 * Generates and displays word cloud + emojis + sentiment analysis.
 */
function generateContent(data) {
  const allText = data.map(d => d.message).join(" ");

  // Word tokenization
  const words = allText.toLowerCase()
    .split(/[.,!?;:"'(){}[\]\s\n\t]+/)
    .filter(w => w.length > 3 && !/^\d+$/.test(w));

  const counts = {};
  words.forEach(w => counts[w] = (counts[w] || 0) + 1);

  const stopwords = new Set([
    'the', 'and', 'you', 'that', 'for', 'are', 'with', 'this', 'have', 'from', 'but',
    'what', 'just', 'like', 'your', 'about', 'can', 'not', 'will', 'was', 'all', 'out',
    'get', 'when', 'one', 'good', 'he', 'she', 'it', 'they', 'we', 'i', 'to', 'a', 'in',
    'is', 'of', 'on', 'at', 'be', 'do', 'go', 'so', 'me', 'us', 'my', 'him', 'her', 'them',
    'if', 'or', 'up', 'down', 'no', 'yes', 'ok', 'okay', 'yeah', 'lol', 'haha', 'hmm',
    'oh', 'hi', 'hey', 'bro', 'sis', 'guy', 'guys', 'really', 'got', 'know', 'see',
    'think', 'send', 'also', 'some', 'any', 'here', 'there', 'who', 'how', 'why', 'where',
    'went', 'said', 'going', 'come', 'much', 'omitted', 'media', 'link', 'image', 'video', 'quote',
    // Español
    'un', 'una', 'unas', 'unos', 'uno', 'sobre', 'todo', 'también', 'tras', 'otro', 'algún',
    'ser', 'es', 'soy', 'eres', 'somos', 'sois', 'estoy', 'esta', 'estamos', 'como', 'en',
    'para', 'porque', 'estado', 'estaba', 'ante', 'antes', 'siendo', 'pero', 'poder', 'puede',
    'ir', 'voy', 'va', 'vamos', 'vais', 'van', 'ha', 'tener', 'tengo', 'tiene', 'tenemos',
    'el', 'la', 'lo', 'las', 'los', 'su', 'aqui', 'mio', 'tuyo', 'ellos', 'ellas', 'nos',
    'nosotros', 'vosotros', 'si', 'dentro', 'solo', 'solamente', 'saber', 'sabes', 'sabe'
  ]);

  const omitSubstrings = new Set(['omitted', 'media', 'link', 'image', 'video', 'quote']);
  const containsOmitted = (word) => Array.from(omitSubstrings).some(sub => word.toLowerCase().includes(sub.toLowerCase()));

  const filteredWords = Object.entries(counts).filter(([word]) =>
    !stopwords.has(word.toLowerCase()) && word.length > 3 && word.length < 50 && !containsOmitted(word)
  );

  const topWords = filteredWords.sort((a, b) => b[1] - a[1]).slice(0, 75);

  // Emoji analysis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]/gu;
  const emojis = new Map();
  data.forEach(msg => {
    const matches = msg.message.match(emojiRegex) || [];
    matches.forEach(emoji => emojis.set(emoji, (emojis.get(emoji) || 0) + 1));
  });
  const topEmojis = Array.from(emojis.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15);

  // Sentiment analysis
  const positiveWords = ['bien', 'bueno', 'genial', 'excelente', 'amazing', 'perfect', 'love', 'great', 'awesome', 'me encanta', 'feliz', 'alegre', 'hermoso', 'espectacular'];
  const negativeWords = ['malo', 'horrible', 'terrible', 'awful', 'hate', 'sick', 'sad', 'triste', 'deprimido', 'enojado', 'furioso', 'disgusto'];

  let positiveCount = 0, negativeCount = 0, neutralCount = 0;
  let totalSentimentScore = 0;

  data.forEach(msg => {
    const msgLower = msg.message.toLowerCase();
    let score = 0;
    positiveWords.forEach(word => { if (msgLower.includes(word)) score += 2; });
    negativeWords.forEach(word => { if (msgLower.includes(word)) score -= 2; });
    totalSentimentScore += score;
    if (score > 0) positiveCount++;
    else if (score < 0) negativeCount++;
    else neutralCount++;
  });

  const sampleChat = data.slice(0, Math.min(50, data.length))
    .map(d => `<p><strong>${d.user}:</strong> <em>${d.message.substring(0, 80)}${d.message.length > 80 ? '...' : ''}</em></p>`)
    .join("");

  const html = `
    <div class="content-analysis">
      <!-- Stats Cards -->
      <div class="chart-container">
        <h3>📊 Estadísticas de Contenido</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <h4>Mensajes</h4>
            <div class="value">${data.length}</div>
          </div>
          <div class="stat-card">
            <h4>Palabras Únicas</h4>
            <div class="value">${filteredWords.length}</div>
          </div>
          <div class="stat-card">
            <h4>Emojis</h4>
            <div class="value">${emojis.size}</div>
          </div>
          <div class="stat-card">
            <h4>Frase Más Usada</h4>
            <div class="value" style="font-size: 0.9em;">${topWords[0] ? topWords[0][0] : 'N/A'}</div>
          </div>
        </div>
      </div>

      <!-- Word Cloud -->
      <div class="chart-container">
        <h3>☁️ Nube de Palabras</h3>
        <p style="font-size:0.9em; color:#777; margin-bottom:15px;">Palabras más frecuentes en el chat</p>
        <div id="wordcloud" style="height: 400px; background: #fafafa; border-radius: 8px;"></div>
      </div>

      <!-- Top Words Bar -->
      <div class="chart-container">
        <h3>🔤 Top 15 Palabras Más Usadas</h3>
        <div style="height: 300px;">
          <canvas id="wordsChart"></canvas>
        </div>
      </div>

      <!-- Emojis -->
      <div class="chart-container">
        <h3>😊 Emojis Más Usados</h3>
        <div class="emoji-grid">
          ${topEmojis.map(e => `
            <div class="emoji-item">
              <span class="emoji-char">${e[0]}</span>
              <span class="emoji-count">${e[1]}x</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Sentiment -->
      <div class="chart-container">
        <h3>💭 Análisis de Sentimientos</h3>
        <div class="sentiment-cards">
          <div class="sentiment-card positive">
            <div class="card-emoji">😊</div>
            <div class="card-label">Positivos</div>
            <div class="card-value">${positiveCount}</div>
            <div class="card-percent">${((positiveCount / data.length) * 100).toFixed(1)}%</div>
          </div>
          <div class="sentiment-card neutral">
            <div class="card-emoji">😐</div>
            <div class="card-label">Neutrales</div>
            <div class="card-value">${neutralCount}</div>
            <div class="card-percent">${((neutralCount / data.length) * 100).toFixed(1)}%</div>
          </div>
          <div class="sentiment-card negative">
            <div class="card-emoji">😞</div>
            <div class="card-label">Negativos</div>
            <div class="card-value">${negativeCount}</div>
            <div class="card-percent">${((negativeCount / data.length) * 100).toFixed(1)}%</div>
          </div>
        </div>
        <div style="height: 250px; margin-top: 20px;">
          <canvas id="sentimentChart"></canvas>
        </div>
      </div>

      <!-- Chat Preview -->
      <div class="chart-container">
        <h3>💬 Vista Previa de Chat</h3>
        <div id="chat-preview" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border); padding: 15px; border-radius: 8px; background: white; font-size: 0.95em;">
          ${sampleChat || '<p style="text-align: center; color: #999;">Sin mensajes</p>'}
        </div>
      </div>
    </div>
  `;

  document.getElementById('content').innerHTML = html;

  // WordCloud
  const wordcloudContainer = document.getElementById('wordcloud');
  if (wordcloudContainer && topWords.length > 0) {
    try {
      WordCloud(wordcloudContainer, {
        list: topWords,
        gridSize: 15,
        weightFactor: 1.5,
        clearCanvas: true,
        shrinkToFit: true,
        rotateRatio: 0.2,
        minRotation: 0,
        maxRotation: 0,
        fontFamily: 'Segoe UI, sans-serif',
        backgroundColor: 'transparent',
        color: () => {
          const colors = ['#25D366', '#667eea', '#764ba2', '#4facfe', '#00f2fe', '#fee140', '#f5576c', '#43e97b'];
          return colors[Math.floor(Math.random() * colors.length)];
        }
      });
    } catch (e) {
      console.warn('WordCloud error:', e);
      wordcloudContainer.innerHTML = '<p style="text-align: center; padding: 50px;">No hay palabras suficientes para generar nube</p>';
    }
  }

  // Top Words Chart
  const top15 = topWords.slice(0, 15);
  const ctxWords = document.getElementById('wordsChart');
  if (ctxWords) {
    createChart(ctxWords, {
      type: 'barH',
      data: {
        labels: top15.map(w => w[0]),
        datasets: [{
          label: 'Frecuencia',
          data: top15.map(w => w[1]),
          backgroundColor: '#667eea',
          borderColor: '#667eea',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } }
      }
    });
  }

  // Sentiment Chart
  const ctxSentiment = document.getElementById('sentimentChart');
  if (ctxSentiment) {
    createChart(ctxSentiment, {
      type: 'doughnut',
      data: {
        labels: ['😊 Positivos', '😐 Neutrales', '😞 Negativos'],
        datasets: [{
          data: [positiveCount, neutralCount, negativeCount],
          backgroundColor: ['#43e97b', '#fee140', '#f5576c'],
          borderColor: 'white',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }
}