let windowActivityChart = null;

function generatePredictions(data) {
    const container = document.getElementById('predictions');
    if (!container) return;

    if (!data.length) {
        container.innerHTML = `<p>No data to predict.</p>`;
        return;
    }

    data.forEach(d => {
        if (!(d.datetime instanceof Date)) d.datetime = new Date(d.datetime);
    });

    // --- Aggregate daily counts ---
    const dailyCounts = {};
    data.forEach(d => {
        const day = d.datetime.toISOString().slice(0,10);
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });

    const sortedDays = Object.keys(dailyCounts).sort();
    const countsArray = sortedDays.map(d => dailyCounts[d]);

    // --- Advanced Forecast: Moving Average + Exponential Smoothing ---
    function smoothForecast(arr, days=30, alpha=0.3) {
        if (!arr.length) return Array(days).fill(0);
        const forecast = [];
        let last = arr[arr.length-1];
        let prev = arr[arr.length-1];

        for (let i = 0; i < days; i++) {
            // Moving average of last 3 points
            const ma = arr.slice(-3).reduce((a,b)=>a+b,0)/Math.min(3, arr.length);
            // Exponential smoothing formula
            const nextVal = alpha*ma + (1-alpha)*prev;
            forecast.push(Math.round(nextVal));
            prev = nextVal;
            arr.push(nextVal); // feed next value for evolving forecast
        }
        return forecast;
    }

    const forecastDays = 30;
    const forecastValues = smoothForecast([...countsArray], forecastDays);

    const lastDate = new Date(sortedDays[sortedDays.length-1]);
    const forecastDates = Array.from({length:forecastDays},(_,i)=>{
        const d = new Date(lastDate);
        d.setDate(d.getDate() + i + 1);
        return d.toISOString().slice(0,10);
    });

    const chartLabels = [...sortedDays, ...forecastDates];
    const chartDataActual = [...countsArray, ...Array(forecastDays).fill(null)];
    const chartDataForecast = [...Array(sortedDays.length).fill(null), ...forecastValues];

    // --- Compute top user ---
    const userCounts = {};
    data.forEach(d => userCounts[d.user] = (userCounts[d.user] || 0) + 1);
    const topUser = Object.entries(userCounts).sort((a,b)=>b[1]-a[1])[0];

    // --- Render HTML ---
    const html = `
        <h2>Chat Predictions & Insights</h2>
        <div class="prediction-card">
            <h4>Most Talkative User</h4>
            <div>${topUser ? topUser[0] : 'N/A'} (${topUser ? topUser[1] : 0} msgs)</div>
        </div>
        <div class="chart-container">
            <h3>📊 Daily Messages: Actual vs Predicted</h3>
            <canvas id="monthlyActivityChart" width="600" height="300"></canvas>
        </div>
    `;
    container.innerHTML = html;

    // --- Render Chart ---
    const canvas = document.getElementById('monthlyActivityChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (windowActivityChart) windowActivityChart.destroy();
        windowActivityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [
                    {
                        label: 'Actual Messages',
                        data: chartDataActual,
                        borderColor: '#4facfe',
                        backgroundColor: 'rgba(79, 172, 254, 0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Predicted Messages',
                        data: chartDataForecast,
                        borderColor: '#f093fb',
                        backgroundColor: 'rgba(240, 147, 251, 0.1)',
                        borderDash: [5,5],
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: true } },
                scales: {
                    x: { title: { display: true, text: 'Date' } },
                    y: { title: { display: true, text: 'Messages' }, beginAtZero: true }
                }
            }
        });
    }
}
