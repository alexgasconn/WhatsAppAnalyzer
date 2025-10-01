/**
 * Generates and displays content-related insights like sentiment and word cloud.
 * @param {Array} data The parsed chat data.
 */
function generateContent(data) {
  const sentiment = new Sentiment(); // Initialize sentiment analysis library
  const allText = data.map(d => d.message).join(" ");
  
  // Basic word tokenization and counting
  const words = allText.toLowerCase()
                       .split(/[.,!?;:"'(){}[\]\s\n\t]+/) // Split by various delimiters
                       .filter(w => w.length > 2 && !/^\d+$/.test(w)); // Filter out short words and pure numbers
  
  const counts = {};
  words.forEach(w => counts[w] = (counts[w] || 0) + 1);
  
  // Common stopwords to exclude from word cloud (can be extended)
  const stopwords = new Set(['the', 'and', 'you', 'that', 'for', 'are', 'with', 'this', 'have', 'from', 'but', 'what', 'just', 'like', 'your', 'about', 'can', 'not', 'will', 'was', 'all', 'out', 'get', 'when', 'one', 'good', 'he', 'she', 'it', 'they', 'we', 'i', 'to', 'a', 'in', 'is', 'of', 'on', 'at', 'be', 'do', 'go', 'so', 'me', 'us', 'my', 'him', 'her', 'them', 'if', 'or', 'up', 'down', 'no', 'yes', 'ok', 'okay', 'yeah', 'lol', 'haha', 'hmm', 'oh', 'hi', 'hey', 'bro', 'sis', 'guy', 'guys', 'ok', 'okay', 'k', 'yeah', 'like', 'really', 'just', 'got', 'know', 'see', 'think', 'send', 'can', 'also', 'some', 'any', 'here', 'there', 'who', 'how', 'why', 'where', 'went', 'said', 'going', 'come', 'much', 'much', 'much']);
  
  const filteredWords = Object.entries(counts).filter(([word]) => !stopwords.has(word));
  const topWords = filteredWords.sort((a,b) => b[1]-a[1]).slice(0,100); // Top 100 words for word cloud

  // Sentiment analysis
  const score = sentiment.analyze(allText).score;
  let sentimentEmoji = "😐";
  let sentimentText = "Neutral";
  if (score > 5) {
      sentimentEmoji = "😀";
      sentimentText = "Very Positive";
  } else if (score > 0) {
      sentimentEmoji = "😊";
      sentimentText = "Positive";
  } else if (score < -5) {
      sentimentEmoji = "😡";
      sentimentText = "Very Negative";
  } else if (score < 0) {
      sentimentEmoji = "☹️";
      sentimentText = "Negative";
  }


  const html = `
    <h2>Chat Content Insights</h2>
    <div class="chart-container">
      <h3>📝 Word Cloud of Frequent Words</h3>
      <p style="font-size:0.9em; color:#777; margin-bottom:15px;">(Excludes short words and common stopwords)</p>
      <div id="wordcloud"></div>
    </div>
    <div class="chart-container">
      <h3>💡 Overall Sentiment Score</h3>
      <p style="font-size:1.5em;">${sentimentEmoji} ${sentimentText} (${score})</p>
      <p style="font-size:0.9em; color:#777;">(Score range: -5 to +5 for words, cumulative for text. Higher is more positive.)</p>
    </div>
  `;
  document.getElementById('content').innerHTML = html;

  // Render the word cloud
  // Ensure the wordcloud container is visible and has dimensions before rendering
  const wordcloudContainer = document.getElementById('wordcloud');
  if (wordcloudContainer && topWords.length > 0) {
      WordCloud(wordcloudContainer, {
        list: topWords,
        gridSize: 10,
        weightFactor: 2,
        color: () => `hsl(${Math.random()*360},70%,60%)`, // Random vibrant colors
        rotateRatio: 0.3, // Some words rotated
        shrinkToFit: true, // Adjust to fit container
        minRotation: -Math.PI / 6, // Minimal rotation angle
        maxRotation: Math.PI / 6,  // Maximal rotation angle
        fontFamily: 'Segoe UI, sans-serif'
      });
  } else if (wordcloudContainer) {
      wordcloudContainer.innerHTML = '<p style="text-align:center; padding:50px;">No sufficient words to generate a word cloud.</p>';
  }
}