function generatePredictions(data) {
    if (!data.length) {
        document.getElementById('predictions').innerHTML = `<p>No data to predict.</p>`;
        return;
    }

    // Convert dates to Date objects
    data.forEach(d => { if (!(d.datetime instanceof Date)) d.datetime = new Date(d.datetime); });

    // --- Aggregate daily counts ---
    const dailyCounts = {};
    data.forEach(d => {
        const day = d.datetime.toISOString().slice(0,10);
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });

    const sortedDays = Object.keys(dailyCounts).sort();
    const countsArray = sortedDays.map(d => dailyCounts[d]);

    // --- Mini AR(1) forecast ---
    function arForecast(arr, factor=0.5, days=7) {
        if (!arr.length) return Array(days).fill(0);
        const last = arr[arr.length-1];
        const avg = arr.reduce((a,b)=>a+b,0)/arr.length;
        return Array(days).fill().map((_,i)=>Math.round(factor*last + (1-factor)*avg));
    }

    // --- Generate forecast for next 30 days ---
    const forecastDays = 30;
    const forecastValues = arForecast(countsArray, 0.5, forecastDays);
    const lastDate = new Date(sortedDays[sortedDays.length-1]);
    const forecastDates = Array.from({length:forecastDays},(_,i)=>{
        const d = new Date(lastDate);
        d.setDate(d.getDate() + i + 1);
        return d.toISOString().slice(0,10);
    });

    // --- Prepare chart data ---
    const chartLabels = [...sortedDays, ...forecastDates];
    const chartDataActual = [...countsArray, ...Array(forecastDays).fill(null)];
    const chartDataForecast = [...Array(sortedDays.length).fill(null), ...forecastValues];

    // --- Chart ---
    const ctx = document.getElementById('monthlyActivityChart').getContext('2d');
    if (window.activityChart) window.activityChart.destroy(); // prevent duplicates
    window.activityChart = new Chart(ctx, {
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

    // --- Render prediction cards as before ---
    const totalMessages = data.length;
    const topUser = Object.entries(data.reduce((acc,d)=>{
        acc[d.user]=(acc[d.user]||0)+1; return acc;
    },{})).sort((a,b)=>b[1]-a[1])[0];

    const groupForecast7  = forecastValues.slice(0,7).reduce((a,b)=>a+b,0);
    const groupForecast30 = forecastValues.slice(0,30).reduce((a,b)=>a+b,0);
    const groupForecast90 = forecastValues.slice(0,90).reduce((a,b)=>a+b,0);

    const users = [...new Set(data.map(d=>d.user))];
    const userForecasts = {};
    users.forEach(u=>{
        const userCounts = {};
        data.filter(d=>d.user===u).forEach(d=>{
            const day = d.datetime.toISOString().slice(0,10);
            userCounts[day] = (userCounts[day]||0)+1;
        });
        const arr = Object.keys(userCounts).sort().map(k=>userCounts[k]);
        const f = arForecast(arr,0.5,90);
        userForecasts[u] = {
            '7': f.slice(0,7).reduce((a,b)=>a+b,0),
            '30': f.slice(0,30).reduce((a,b)=>a+b,0),
            '90': f.slice(0,90).reduce((a,b)=>a+b,0)
        };
    });

    let html = `
        <h2>Chat Predictions & Insights</h2>
        <div class="prediction-card">
            <h4>Most Talkative User</h4>
            <div>${topUser ? topUser[0] : 'N/A'} (${topUser ? topUser[1] : 0} msgs)</div>
        </div>
        <h3>🔮 Future Message Predictions</h3>
        <div class="relationship-grid">
            <div class="relationship-card">
                <h4>Group Predictions</h4>
                <div>Next 7 Days: ${groupForecast7}</div>
                <div>Next 30 Days: ${groupForecast30}</div>
                <div>Next 90 Days: ${groupForecast90}</div>
            </div>
            ${users.map(u=>`
                <div class="relationship-card">
                    <h4>${u}'s Predictions</h4>
                    <div>Next 7 Days: ${userForecasts[u]['7']}</div>
                    <div>Next 30 Days: ${userForecasts[u]['30']}</div>
                    <div>Next 90 Days: ${userForecasts[u]['90']}</div>
                </div>
            `).join('')}
        </div>
    `;
    document.getElementById('predictions').innerHTML = html;
}
