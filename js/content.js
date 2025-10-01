/**
 * Generates and displays word cloud + chat snippet.
 * @param {Array} data The parsed chat data.
 */
function generateContent(data) {
  const allText = data.map(d => d.message).join(" ");

  // Basic word tokenization and counting
  const words = allText.toLowerCase()
                       .split(/[.,!?;:"'(){}[\]\s\n\t]+/) 
                       .filter(w => w.length > 2 && !/^\d+$/.test(w));

  const counts = {};
  words.forEach(w => counts[w] = (counts[w] || 0) + 1);

  // Common stopwords
  const stopwords = new Set([
    'the','and','you','that','for','are','with','this','have','from','but',
    'what','just','like','your','about','can','not','will','was','all','out',
    'get','when','one','good','he','she','it','they','we','i','to','a','in',
    'is','of','on','at','be','do','go','so','me','us','my','him','her','them',
    'if','or','up','down','no','yes','ok','okay','yeah','lol','haha','hmm',
    'oh','hi','hey','bro','sis','guy','guys','really','got','know','see',
    'think','send','also','some','any','here','there','who','how','why','where',
    'went','said','going','come','much'
  ]);

  const filteredWords = Object.entries(counts).filter(([word]) => !stopwords.has(word));
  const topWords = filteredWords.sort((a,b) => b[1]-a[1]).slice(0,100); 

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
        list: topWords,
        gridSize: 10,
        weightFactor: 2,
        color: () => `hsl(${Math.random()*360},70%,60%)`,
        rotateRatio: 0.3,
        shrinkToFit: true,
        minRotation: -Math.PI / 6,
        maxRotation: Math.PI / 6,
        fontFamily: 'Segoe UI, sans-serif'
      });
  } else if (wordcloudContainer) {
      wordcloudContainer.innerHTML = '<p style="text-align:center; padding:50px;">No sufficient words to generate a word cloud.</p>';
  }
}
