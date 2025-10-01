/**
 * Generates and displays word cloud + chat snippet.
 * @param {Array} data The parsed chat data.
 */
function generateContent(data) {
  const allText = data.map(d => d.message).join(" ");

  // Basic word tokenization and counting
  const words = allText.toLowerCase()
    .split(/[.,!?;:"'(){}[\]\s\n\t]+/)
    .filter(w => w.length > 3 && !/^\d+$/.test(w));  // Ajustado a >3 letras

  const counts = {};
  words.forEach(w => counts[w] = (counts[w] || 0) + 1);

  // Common stopwords
  const stopwords = new Set([
    'the', 'and', 'you', 'that', 'for', 'are', 'with', 'this', 'have', 'from', 'but',
    'what', 'just', 'like', 'your', 'about', 'can', 'not', 'will', 'was', 'all', 'out',
    'get', 'when', 'one', 'good', 'he', 'she', 'it', 'they', 'we', 'i', 'to', 'a', 'in',
    'is', 'of', 'on', 'at', 'be', 'do', 'go', 'so', 'me', 'us', 'my', 'him', 'her', 'them',
    'if', 'or', 'up', 'down', 'no', 'yes', 'ok', 'okay', 'yeah', 'lol', 'haha', 'hmm',
    'oh', 'hi', 'hey', 'bro', 'sis', 'guy', 'guys', 'really', 'got', 'know', 'see',
    'think', 'send', 'also', 'some', 'any', 'here', 'there', 'who', 'how', 'why', 'where',
    'went', 'said', 'going', 'come', 'much', 'omitted', 'media', 'link', 'image', 'video', 'quote', 'reply', 'null', 'www', 'HTMLOutputElement', 'HTMLOptionsCollection', 'twitter', 'edited',
    // Español
    'un', 'una', 'unas', 'unos', 'uno', 'sobre', 'todo', 'también', 'tras', 'otro', 'algún', 'alguno', 'alguna', 'algunos', 'algunas', 'ser', 'es', 'soy', 'eres', 'somos', 'sois', 'estoy', 'esta', 'estamos', 'estais', 'estan', 'como', 'en', 'para', 'atras', 'porque', 'por qué', 'estado', 'estaba', 'ante', 'antes', 'siendo', 'ambos', 'pero', 'por', 'poder', 'puede', 'puedo', 'podemos', 'podeis', 'pueden', 'fui', 'fue', 'fuimos', 'fueron', 'hacer', 'hago', 'hace', 'hacemos', 'haceis', 'hacen', 'cada', 'fin', 'incluso', 'primero', 'desde', 'conseguir', 'consigo', 'consigue', 'consigues', 'conseguimos', 'consiguen', 'ir', 'voy', 'va', 'vamos', 'vais', 'van', 'vaya', 'gueno', 'ha', 'tener', 'tengo', 'tiene', 'tenemos', 'teneis', 'tienen', 'el', 'la', 'lo', 'las', 'los', 'su', 'aqui', 'mio', 'tuyo', 'ellos', 'ellas', 'nos', 'nosotros', 'vosotros', 'vosotras', 'si', 'dentro', 'solo', 'solamente', 'saber', 'sabes', 'sabe', 'sabemos', 'sabeis', 'saben', 'ultimo', 'largo', 'bastante', 'haces', 'muchos', 'aquellos', 'aquellas', 'sus', 'entonces', 'tiempo', 'verdad', 'verdadero', 'verdadera', 'cierto', 'ciertos', 'cierta', 'ciertas', 'intentar', 'intento', 'intenta', 'intentas', 'intentamos', 'intentais', 'intentan', 'dos', 'bajo', 'arriba', 'encima', 'usar', 'uso', 'usas', 'usa', 'usamos', 'usais', 'usan', 'emplear', 'empleo', 'empleas', 'emplean', 'ampleamos', 'empleais', 'valor', 'muy', 'era', 'eras', 'eramos', 'eran', 'modo', 'bien', 'cual', 'cuando', 'donde', 'mientras', 'quien', 'con', 'entre', 'sin', 'trabajo', 'trabajar', 'trabajas', 'trabaja', 'trabajamos', 'trabajais', 'trabajan', 'podria', 'podrias', 'podriamos', 'podrian', 'podriais', 'yo', 'aquel',
    // Catalán
    'de', 'es', 'i', 'a', 'o', 'un', 'una', 'unes', 'uns', 'tot', 'també', 'altre', 'algun', 'alguna', 'alguns', 'algunes', 'ser', 'és', 'soc', 'ets', 'som', 'estic', 'està', 'estem', 'esteu', 'estan', 'com', 'en', 'per', 'perquè', 'per que', 'estat', 'estava', 'ans', 'abans', 'éssent', 'ambdós', 'però', 'poder', 'potser', 'puc', 'podem', 'podeu', 'poden', 'vaig', 'va', 'van', 'fer', 'faig', 'fa', 'fem', 'feu', 'fan', 'cada', 'fi', 'inclòs', 'primer', 'des de', 'conseguir', 'consegueixo', 'consigueix', 'consigues', 'conseguim', 'consigueixen', 'anar', 'haver', 'tenir', 'tinc', 'te', 'tenim', 'teniu', 'tene', 'el', 'la', 'les', 'els', 'seu', 'aquí', 'meu', 'teu', 'ells', 'elles', 'ens', 'nosaltres', 'vosaltres', 'si', 'dins', 'sols', 'solament', 'saber', 'saps', 'sap', 'sabem', 'sabeu', 'saben', 'últim', 'llarg', 'bastant', 'fas', 'molts', 'aquells', 'aquelles', 'seus', 'llavors', 'sota', 'dalt', 'ús', 'molt', 'era', 'eres', 'erem', 'eren', 'mode', 'bé', 'quant', 'quan', 'on', 'mentre', 'qui', 'amb', 'entre', 'sense', 'jo', 'aquell'
  ]);

  // Set de substrings a omitir (puedes expandirlo)
  const omitSubstrings = new Set(['omitted', 'media', 'link', 'image', 'video', 'quote', 'reply']);

  // Función auxiliar para verificar si la palabra contiene algún substring omitido
  const containsOmitted = (word) => {
    return Array.from(omitSubstrings).some(sub => word.toLowerCase().includes(sub.toLowerCase()));
  };

  const filteredWords = Object.entries(counts).filter(([word]) => 
    !stopwords.has(word.toLowerCase()) &&  // Ignora mayúsculas/minúsculas en stopwords
    word.length > 3 &&
    word.length < 50 &&
    !containsOmitted(word)
  );

  const topWords = filteredWords.sort((a, b) => b[1] - a[1]).slice(0, 30);

  // Pick a subset of chat to "recreate"
  const sampleChat = data.slice(0, 20) // first 20 messages (or random slice if you want)
    .map(d => `<p><strong>${d.user}:</strong> ${d.message}</p>`)
    .join("");

  const html = `
    <h2>Chat Content</h2>
    <div class="chart-container">
      <h3>📝 Word Cloud of Frequent Words</h3>
      <p style="font-size:0.9em; color:#777; margin-bottom:15px;">(Excludes short words and common stopwords)</p>
      <div id="wordcloud"></div>
    </div>
    <div class="chart-container">
      <h3>💬 Chat Recreation (sample)</h3>
      <div id="chat-preview" style="max-height:300px; overflow-y:auto; border:1px solid #ccc; padding:10px; border-radius:8px; background:#fafafa;">
        ${sampleChat}
      </div>
    </div>
  `;
  document.getElementById('content').innerHTML = html;

  // Render the word cloud
  const wordcloudContainer = document.getElementById('wordcloud');
  if (wordcloudContainer && topWords.length > 0) {
    WordCloud(wordcloudContainer, {
      list: topWords,                 // keep at most ~100 words
      gridSize: 15,                   // slightly bigger grid -> fewer checks
      weightFactor: 1.5,              // smaller font scaling
      clearCanvas: true,
      shrinkToFit: true,
      rotateRatio: 0.2,               // fewer rotated words
      minRotation: 0,
      maxRotation: 0,
      fontFamily: 'Segoe UI, sans-serif',
      backgroundColor: '#fff'         // avoids transparent canvas issues
    });

  } else if (wordcloudContainer) {
    wordcloudContainer.innerHTML = '<p style="text-align:center; padding:50px;">No sufficient words to generate a word cloud.</p>';
  }
}