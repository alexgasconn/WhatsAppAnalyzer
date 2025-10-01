/**
 * Generates and displays simple predictions based on chat data.
 * @param {Array} data The parsed chat data.
 */
function generatePredictions(data) {
  const userCounts = {};
  data.forEach(d => userCounts[d.user] = (userCounts[d.user] || 0) + 1);
  
  // Find the user with the most messages
  const topUser = Object.entries(userCounts).sort((a,b)=>b[1]-a[1])[0];

  // Calculate average messages per day
  const dates = data.map(d => d.datetime);
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const totalDurationMs = maxDate - minDate;
  const totalDurationDays = totalDurationMs / (1000 * 60 * 60 * 24);

  let avgPerDay = 0;
  if (totalDurationDays > 0) {
    avgPerDay = (data.length / totalDurationDays).toFixed(1);
  } else if (data.length > 0) {
    avgPerDay = data.length; // If only one day of data, it's messages per day
  }

  const html = `
    <h2>Chat Predictions & Insights</h2>
    <div class="prediction-card">
      <h4>Most Talkative User Prediction</h4>
      <div class="prediction-value">${topUser ? topUser[0] : 'N/A'}</div>
      <div class="prediction-details">with ${topUser ? topUser[1].toLocaleString() : 0} messages recorded.</div>
    </div>
    <div class="prediction-card">
      <h4>Average Daily Activity</h4>
      <div class="prediction-value">${avgPerDay} msgs/day</div>
      <div class="prediction-details">based on past conversation trends.</div>
    </div>
    <div class="chart-container">
        <h3>📊 Monthly Activity Trend</h3>
        <canvas id="monthlyActivityChart"></canvas>
    </div>
  `;
  document.getElementById('predictions').innerHTML = html;

  // Chart: Monthly Activity Trend
  const monthlyData = {};
  data.forEach(d => {
      const monthYear = d.datetime.toLocaleString('en-US', { year: 'numeric', month: 'short' });
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
  });

  // Sort labels chronologically (requires parsing dates)
  const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
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