/**
 * Generates and displays relationship insights based on message replies.
 * @param {Array} data The parsed chat data.
 */
function generateRelationships(data) {
  const pairs = {};
  // Iterate through messages to find direct replies (sequential messages by different users)
  for (let i = 0; i < data.length - 1; i++) {
    const sender = data[i].user;
    const receiver = data[i + 1].user;
    // Only count if different users
    if (sender !== receiver) {
      // Create a consistent key for the pair, regardless of who messaged first
      const key = [sender, receiver].sort().join(' & ');
      pairs[key] = (pairs[key] || 0) + 1;
    }
  }

  // Sort pairs by count and take the top 5
  const sortedPairs = Object.entries(pairs)
                           .sort((a, b) => b[1] - a[1])
                           .slice(0, 5);

  let html = '<h2>Top Conversational Pairs</h2><div class="relationship-grid">';
  if (sortedPairs.length === 0) {
    html += '<p>No direct conversational pairs found yet. Keep chatting!</p>';
  } else {
    sortedPairs.forEach(([pair, count]) => {
      html += `
        <div class="relationship-card">
          <h4>Pair: ${pair}</h4>
          <div class="relationship-item">
            <span class="relationship-label">Number of interactions</span>
            <span class="relationship-value">${count}</span>
          </div>
        </div>`;
    });
  }
  html += '</div>';

  document.getElementById('relationships').innerHTML = html;
}