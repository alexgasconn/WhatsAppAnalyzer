/**
 * Generates and displays simple predictions based on chat data.
 * @param {Array} data The parsed chat data.
 */
function generatePredictions(data) {
  const userCounts = {};
  data.forEach(d => userCounts[d.user] = (userCounts[d.user] || 0) + 1);
  
  // Find the user with the most messages
  const topUser = Object.entries(userCounts).sort((a,b)=>b[1]-a[1])[0];

  // Calculate average messages per day for the group
  const dates = data.map(d => d.datetime);
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  // Ensure dates are valid for calculation, especially with filtered data
  const totalDurationMs = maxDate.getTime() - minDate.getTime();
  let totalDurationDays = totalDurationMs / (1000 * 60 * 60 * 24);
  if (totalDurationDays < 1 && data.length > 0) { // If all messages on same day, count as 1 day duration
      totalDurationDays = 1;
  } else if (data.length === 0) {
      totalDurationDays = 0; // Avoid division by zero
  }
  
  const avgGroupMessagesPerDay = totalDurationDays > 0 ? (data.length / totalDurationDays) : 0;

  // Calculate average messages per day for each user
  const userDailyAverages = {};
  Object.keys(userCounts).forEach(user => {
      const userMessages = data.filter(d => d.user === user);
      // Recalculate duration for user's activity range
      const userDates = userMessages.map(d => d.datetime);
      const userMinDate = userDates.length > 0 ? new Date(Math.min(...userDates)) : null;
      const userMaxDate = userDates.length > 0 ? new Date(Math.max(...userDates)) : null;

      let userDurationDays = 0;
      if (userMinDate && userMaxDate) {
          userDurationDays = (userMaxDate.getTime() - userMinDate.getTime()) / (1000 * 60 * 60 * 24);
      }
      if (userDurationDays < 1 && userMessages.length > 0) {
          userDurationDays = 1;
      }
      
      userDailyAverages[user] = userDurationDays > 0 ? (userMessages.length / userDurationDays) : 0;
  });


  const html = `
    <h2>Chat Predictions & Insights</h2>
    <div class="prediction-card">
      <h4>Most Talkative User Prediction</h4>
      <div class="prediction-value">${topUser ? topUser[0] : 'N/A'}</div>
      <div class="prediction-details">with ${topUser ? topUser[1].toLocaleString() : 0} messages recorded.</div>
    </div>
    <div class="prediction-card">
      <h4>Overall Average Daily Activity</h4>
      <div class="prediction-value">${avgGroupMessagesPerDay.toFixed(1)} msgs/day</div>
      <div class="prediction-details">based on current filtered conversation.</div>
    </div>

    <h3>🔮 Future Message Predictions (Based on Average Daily Activity)</h3>
    <div class="relationship-grid">
        <div class="relationship-card">
            <h4>Group Predictions</h4>
            <div class="relationship-item">
                <span class="relationship-label">Next 7 Days</span>
                <span class="relationship-value">${Math.round(avgGroupMessagesPerDay * 7).toLocaleString()} msgs</span>
            </div>
            <div class="relationship-item">
                <span class="relationship-label">Next 30 Days</span>
                <span class="relationship-value">${Math.round(avgGroupMessagesPerDay * 30).toLocaleString()} msgs</span>
            </div>
            <div class="relationship-item">
                <span class="relationship-label">Next 90 Days</span>
                <span class="relationship-value">${Math.round(avgGroupMessagesPerDay * 90).toLocaleString()} msgs</span>
            </div>
        </div>

        ${Object.keys(userDailyAverages).length > 0 ? 
            Object.keys(userDailyAverages).map(user => `
                <div class="relationship-card">
                    <h4>${user}'s Predictions</h4>
                    <div class="relationship-item">
                        <span class="relationship-label">Next 7 Days</span>
                        <span class="relationship-value">${Math.round(userDailyAverages[user] * 7).toLocaleString()} msgs</span>
                    </div>
                    <div class="relationship-item">
                        <span class="relationship-label">Next 30 Days</span>
                        <span class="relationship-value">${Math.round(userDailyAverages[user] * 30).toLocaleString()} msgs</span>
                    </div>
                    <div class="relationship-item">
                        <span class="relationship-label">Next 90 Days</span>
                        <span class="relationship-value">${Math.round(userDailyAverages[user] * 90).toLocaleString()} msgs</span>
                    </div>
                </div>
            `).join('')
            : '<p class="relationship-card">No individual user data to make predictions.</p>'
        }
    </div>

    <div class="chart-container">
        <h3>📊 Monthly Activity Trend</h3>
        <canvas id="monthlyActivityChart"></canvas>
    </div>
  `;
  document.getElementById('predictions').innerHTML = html;

  // Chart: Monthly Activity Trend (remains the same)
  const monthlyData = {};
  data.forEach(d => {
      const monthYear = d.datetime.toLocaleString('en-US', { year: 'numeric', month: 'short' });
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
  });

  const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
    const dateA = new Date(a + ' 1, 2000'); // Append day and year to parse correctly if only month/year
    const dateB = new Date(b + ' 1, 2000');
    return dateA - dateB;
  });
  const monthlyCounts = sortedMonths.map(month => monthlyData[month]);

  const ctx = document.getElementById('monthlyActivityChart').getContext('2d');
  chartInstances.push(new Chart(ctx, {
      type: 'line',
      data: {
          labels: sortedMonths,
          datasets: [{
              label: 'Messages per Month',
              data: monthlyCounts,
              borderColor: '#4facfe',
              backgroundColor: 'rgba(79, 172, 254, 0.1)',
              fill: true,
              tension: 0.3
          }]
      },
      options: {
          responsive: true,
          plugins: {
              legend: { display: false }
          },
          scales: {
              x: {
                  title: {
                      display: true,
                      text: 'Month'
                  }
              },
              y: {
                  title: {
                      display: true,
                      text: 'Number of Messages'
                  },
                  beginAtZero: true
              }
          }
      }
  }));
}