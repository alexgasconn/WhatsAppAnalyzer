/**
 * Generates user-specific statistics and charts in individual cards.
 * @param {Array} data The parsed chat data.
 */
function generateUsers(data) {
  const userStats = {};
  const now = new Date();

  // Precompute message stats per user
  data.forEach(d => {
    if (!userStats[d.user]) {
      userStats[d.user] = {
        messages: 0,
        words: 0,
        avgLength: [],
        emojis: 0,
        lastMessage: d,
        firstMessage: d,
        timestamps: [],
        responseTimes: []
      };
    }
    const u = userStats[d.user];
    u.messages++;
    const words = d.message.split(/\s+/).filter(Boolean).length;
    u.words += words;
    u.avgLength.push(d.message.length);

    if (d.datetime > u.lastMessage.datetime) u.lastMessage = d;
    if (d.datetime < u.firstMessage.datetime) u.firstMessage = d;

    u.timestamps.push(d.datetime);

    // emoji count
    if (window.emojiDictionary) {
      for (const char of d.message) {
        if (window.emojiDictionary.getName(char)) {
          u.emojis++;
        }
      }
    }
  });

  // Compute per-user derived stats
  Object.keys(userStats).forEach(user => {
    const u = userStats[user];
    const daysActive = Math.max(1, (now - new Date(u.firstMessage.datetime)) / (1000*60*60*24));
    u.avgPerDay = (u.messages / daysActive).toFixed(2);
    u.avgMsgLength = (u.words / u.messages).toFixed(1);

    // Common hours (histogram by hour of day)
    const hours = Array(24).fill(0);
    u.timestamps.forEach(ts => {
      hours[new Date(ts).getHours()]++;
    });
    u.hourHist = hours;
  });

  // Render user cards
  let html = `<div class="user-cards">`;
  Object.keys(userStats).forEach(user => {
    const u = userStats[user];
    const cardId = user.replace(/\W+/g, "_");

    html += `
      <div class="user-card">
        <h3>${user}</h3>
        <p><b>First message:</b> ${new Date(u.firstMessage.datetime).toLocaleString()}</p>
        <p><b>Last message:</b> ${new Date(u.lastMessage.datetime).toLocaleString()}</p>
        <p><b>Total messages:</b> ${u.messages}</p>
        <p><b>Words:</b> ${u.words}</p>
        <p><b>Avg msg length:</b> ${u.avgMsgLength} chars</p>
        <p><b>Avg per day:</b> ${u.avgPerDay}</p>
        <p><b>Emojis used:</b> ${u.emojis}</p>

        <div class="chart-container">
          <canvas id="hours_${cardId}"></canvas>
        </div>
      </div>
    `;
  });
  html += `</div>`;

  document.getElementById('users').innerHTML = html;

  // Now attach charts per user (histogram of hours)
  Object.keys(userStats).forEach(user => {
    const u = userStats[user];
    const cardId = user.replace(/\W+/g, "_");

    const ctx = document.getElementById(`hours_${cardId}`).getContext('2d');
    chartInstances.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Array.from({length: 24}, (_, i) => i+":00"),
        datasets: [{
          label: 'Messages by Hour',
          data: u.hourHist,
          backgroundColor: 'rgba(54, 162, 235, 0.6)'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { maxRotation: 90, minRotation: 45 } } }
      }
    }));
  });
}
