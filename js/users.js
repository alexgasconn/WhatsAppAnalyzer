/**
 * Generates and displays user-specific statistics and charts.
 * @param {Array} data The parsed chat data.
 */
function generateUsers(data) {
  const userStats = {};
  data.forEach(d => {
    if (!userStats[d.user]) {
      userStats[d.user] = {
        messages: 0,
        words: 0,
        avgLength: [],
        emojis: 0
      };
    }
    userStats[d.user].messages++;
    const words = d.message.split(/\s+/).filter(Boolean).length;
    userStats[d.user].words += words;
    userStats[d.user].avgLength.push(d.message.length);
    
    // Check if emojiDictionary is loaded before using it
    if (window.emojiDictionary) {
      for (const char of d.message) {
        if (window.emojiDictionary.getName(char)) {
          userStats[d.user].emojis++;
        }
      }
    }
  });

  const users = Object.keys(userStats);
  const html = `
    <div class="chart-container">
      <h3>💬 Messages per User</h3>
      <canvas id="usersMessages"></canvas>
    </div>

    <div class="chart-container">
      <h3>📝 Words per User</h3>
      <canvas id="usersWords"></canvas>
    </div>

    <div class="chart-container">
      <h3>😊 Emoji Usage</h3>
      <canvas id="usersEmojis"></canvas>
    </div>
  `;

  document.getElementById('users').innerHTML = html;

  // Chart 1: Messages per User (Bar)
  const ctx1 = document.getElementById('usersMessages').getContext('2d');
  chartInstances.push(new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: users,
      datasets: [{
        label: 'Total Messages',
        data: users.map(u => userStats[u].messages),
        backgroundColor: 'rgba(102, 126, 234, 0.7)'
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  }));

  // Chart 2: Words per User (Bar)
  const ctx2 = document.getElementById('usersWords').getContext('2d');
  chartInstances.push(new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: users,
      datasets: [{
        label: 'Total Words',
        data: users.map(u => userStats[u].words),
        backgroundColor: 'rgba(240, 147, 251, 0.7)'
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  }));

  // Chart 3: Emoji Usage per User (Bar)
  const ctx3 = document.getElementById('usersEmojis').getContext('2d');
  chartInstances.push(new Chart(ctx3, {
    type: 'bar',
    data: {
      labels: users,
      datasets: [{
        label: 'Emojis Used',
        data: users.map(u => userStats[u].emojis),
        backgroundColor: 'rgba(255, 193, 7, 0.7)'
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  }));
}