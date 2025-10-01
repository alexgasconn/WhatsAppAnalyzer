let windowActivityChart = null; // store chart globally

function generatePredictions(data) {
    const container = document.getElementById('predictions');
    if (!container) return;

    if (!data.length) {
        container.innerHTML = `<p>No data to predict.</p>`;
        return;
    }

    // Convert dates to Date objects
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

    // --- Detect season length (weekly seasonality if enough data) ---
    function detectSeasonLength(arr){
        return arr.length >=14 ? 7 : 1; // if >=2 weeks data, season = 7 days
    }
    const seasonLength = detectSeasonLength(countsArray);

    // --- Adaptive SARIMA-like forecast ---
    function adaptiveSARIMA(arr, weeks=12, seasonLengthParam=1) {
        const seasonLen = seasonLengthParam;
        if (!arr.length) return Array(weeks).fill(0);

        let forecast = [];
        let lastVal = arr[arr.length-1];
        let trend = arr.length >=2 ? (arr.slice(-seasonLen).reduce((a,b)=>a+b,0) - arr.slice(-2*seasonLen,-seasonLen).reduce((a,b)=>a+b,0))/seasonLen : 0;

        let seasonals = [];
        for (let i=0;i<seasonLen;i++){
            let vals=[];
            for (let j=i;j<arr.length;j+=seasonLen) vals.push(arr[j]);
            seasonals.push(vals.reduce((a,b)=>a+b,0)/vals.length - arr.reduce((a,b)=>a+b,0)/arr.length);
        }

        for (let i=0;i<weeks;i++){
            const seasonal = seasonals[i%seasonLen] || 0;
            const deviation = arr.length>0 ? Math.abs(arr[arr.length-1]-arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
            const alpha = Math.min(0.9, 0.3 + 0.7*Math.min(1,deviation/Math.max(1,arr.reduce((a,b)=>a+b,0)/arr.length)));
            const nextVal = lastVal + trend + seasonal;
            const smoothed = alpha*nextVal + (1-alpha)*lastVal;
            forecast.push(Math.round(smoothed));
            trend = 0.7*trend + 0.3*(smoothed - lastVal);
            lastVal = smoothed;
        }
        return forecast;
    }

    // --- Weekly aggregation ---
    function aggregateWeekly(arr) {
        const weeks = [];
        for (let i=0;i<arr.length;i+=7){
            weeks.push(arr.slice(i,i+7).reduce((a,b)=>a+b,0));
        }
        return weeks;
    }

    const dailyWeeks = aggregateWeekly(countsArray);
    const forecastWeeks = 12; // next 12 weeks
    const forecastValues = adaptiveSARIMA(dailyWeeks, forecastWeeks, seasonLength);

    // --- Generate chart labels (weekly) ---
    const lastDate = new Date(sortedDays[sortedDays.length-1]);
    const chartLabels = [];
    for (let i=0;i<dailyWeeks.length + forecastWeeks;i++){
        const d = new Date(lastDate);
        d.setDate(d.getDate() + i*7);
        chartLabels.push(d.toISOString().slice(0,10));
    }

    const chartDataActual = [...dailyWeeks, ...Array(forecastWeeks).fill(null)];
    const chartDataForecast = [...Array(dailyWeeks.length).fill(null), ...forecastValues];

    // --- Compute group + top user ---
    const userCounts = {};
    data.forEach(d => userCounts[d.user] = (userCounts[d.user] || 0) + 1);
    const topUser = Object.entries(userCounts).sort((a,b)=>b[1]-a[1])[0];

    // --- Compute group forecast sums ---
    const groupForecast7  = forecastValues.slice(0,1)[0] || 0; // first week
    const groupForecast30 = forecastValues.slice(0,4).reduce((a,b)=>a+b,0); // ~1 month
    const groupForecast90 = forecastValues.slice(0,12).reduce((a,b)=>a+b,0); // 3 months

    // --- Compute per-user forecasts ---
    const users = [...new Set(data.map(d=>d.user))];
    const userForecasts = {};
    users.forEach(u=>{
        const userDailyCounts = {};
        data.filter(d=>d.user===u).forEach(d=>{
            const day = d.datetime.toISOString().slice(0,10);
            userDailyCounts[day] = (userDailyCounts[day]||0)+1;
        });
        const arr = aggregateWeekly(Object.keys(userDailyCounts).sort().map(k=>userDailyCounts[k]));
        const f = adaptiveSARIMA(arr, 12, seasonLength);
        userForecasts[u] = {
            '1': f.slice(0,1).reduce((a,b)=>a+b,0),
            '4': f.slice(0,4).reduce((a,b)=>a+b,0),
            '12': f.slice(0,12).reduce((a,b)=>a+b,0)
        };
    });

    // --- Render HTML ---
    const html = `
        <h2>Chat Predictions & Insights</h2>
        <div class="prediction-card">
            <h4>Most Talkative User</h4>
            <div>${topUser ? topUser[0] : 'N/A'} (${topUser ? topUser[1] : 0} msgs)</div>
        </div>
        <h3>🔮 Future Message Predictions (Weekly)</h3>
        <div class="relationship-grid">
            <div class="relationship-card">
                <h4>Group Predictions</h4>
                <div>Next Week: ${groupForecast7}</div>
                <div>Next 4 Weeks: ${groupForecast30}</div>
                <div>Next 12 Weeks: ${groupForecast90}</div>
            </div>
            ${users.map(u=>`
                <div class="relationship-card">
                    <h4>${u}'s Predictions</h4>
                    <div>Next Week: ${userForecasts[u]['1']}</div>
                    <div>Next 4 Weeks: ${userForecasts[u]['4']}</div>
                    <div>Next 12 Weeks: ${userForecasts[u]['12']}</div>
                </div>
            `).join('')}
        </div>
        <div class="chart-container">
            <h3>📊 Weekly Messages: Actual vs Predicted</h3>
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
                    x: { title: { display: true, text: 'Week Starting' } },
                    y: { title: { display: true, text: 'Messages' }, beginAtZero: true }
                }
            }
        });
    }
}
