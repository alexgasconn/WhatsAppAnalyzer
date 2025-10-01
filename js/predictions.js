let windowActivityChart = null;

function generateWeeklyPredictions(data) {
    const container = document.getElementById('predictions');
    if (!container) return;
    if (!data.length) {
        container.innerHTML = `<p>No data to predict.</p>`;
        return;
    }

    // Convert to Date objects
    data.forEach(d => {
        if (!(d.datetime instanceof Date)) d.datetime = new Date(d.datetime);
    });

    // --- Aggregate weekly counts ---
    function getWeekKey(date) {
        const d = new Date(date);
        const firstDay = new Date(d.getFullYear(),0,1);
        const weekNo = Math.ceil((((d - firstDay)/86400000)+firstDay.getDay()+1)/7);
        return `${d.getFullYear()}-W${weekNo}`;
    }

    const weeklyCounts = {};
    data.forEach(d => {
        const week = getWeekKey(d.datetime);
        weeklyCounts[week] = (weeklyCounts[week]||0)+1;
    });

    const sortedWeeks = Object.keys(weeklyCounts).sort();
    const countsArray = sortedWeeks.map(w => weeklyCounts[w]);

    // --- Forecast: Moving Average + Exponential Smoothing ---
    function weeklyForecast(arr, weeks=12, alpha=0.3, maWindow=3) {
        if (!arr.length) return Array(weeks).fill(0);
        const forecast = [];
        let series = [...arr];
        let prev = arr[arr.length-1];
        for (let i=0;i<weeks;i++) {
            const windowVals = series.slice(-maWindow);
            const ma = windowVals.reduce((a,b)=>a+b,0)/windowVals.length;
            const nextVal = alpha*ma + (1-alpha)*prev;
            forecast.push(Math.round(nextVal));
            prev = nextVal;
            series.push(nextVal);
        }
        return forecast;
    }

    const forecastWeeks = 12;
    const forecastValues = weeklyForecast(countsArray, forecastWeeks, 0.3, 3);

    // --- Generate week labels for forecast ---
    const lastWeekParts = sortedWeeks[sortedWeeks.length-1].split('-W');
    const lastYear = parseInt(lastWeekParts[0]);
    let lastWeekNo = parseInt(lastWeekParts[1]);
    const forecastLabels = [];
    for (let i=1;i<=forecastWeeks;i++){
        lastWeekNo++;
        let year = lastYear;
        let week = lastWeekNo;
        if (week>52){ week-=52; year+=1;}
        forecastLabels.push(`${year}-W${week}`);
    }

    // --- Chart data ---
    const chartLabels = [...sortedWeeks, ...forecastLabels];
    const chartDataActual = [...countsArray, ...Array(forecastWeeks).fill(null)];
    const chartDataForecast = [...Array(sortedWeeks.length).fill(null), ...forecastValues];

    // --- Top user + per-user forecast ---
    const userCounts = {};
    data.forEach(d => userCounts[d.user] = (userCounts[d.user]||0)+1);
    const topUser = Object.entries(userCounts).sort((a,b)=>b[1]-a[1])[0];

    const users = [...new Set(data.map(d=>d.user))];
    const userForecasts = {};
    users.forEach(u=>{
        const userWeeks = {};
        data.filter(d=>d.user===u).forEach(d=>{
            const w = getWeekKey(d.datetime);
            userWeeks[w] = (userWeeks[w]||0)+1;
        });
        const arr = Object.keys(userWeeks).sort().map(k=>userWeeks[k]);
        const f = weeklyForecast(arr, forecastWeeks, 0.3, 3);
        userForecasts[u] = f;
    });

    // --- Render HTML ---
    const html = `
        <h2>Chat Predictions & Insights (Weekly)</h2>
        <div class="prediction-card">
            <h4>Most Talkative User</h4>
            <div>${topUser ? topUser[0] : 'N/A'} (${topUser ? topUser[1] : 0} msgs)</div>
        </div>
        <h3>🔮 Weekly Predictions</h3>
        <div class="relationship-grid">
            <div class="relationship-card">
                <h4>Group Forecast (Next ${forecastWeeks} Weeks)</h4>
                ${forecastValues.map((v,i)=>`<div>${forecastLabels[i]}: ${v}</div>`).join('')}
            </div>
            ${users.map(u=>`
                <div class="relationship-card">
                    <h4>${u}'s Forecast</h4>
                    ${userForecasts[u].map((v,i)=>`<div>${forecastLabels[i]}: ${v}</div>`).join('')}
                </div>
            `).join('')}
        </div>
        <div class="chart-container">
            <h3>📊 Weekly Messages: Actual vs Predicted</h3>
            <canvas id="monthlyActivityChart" width="800" height="400"></canvas>
        </div>
    `;
    container.innerHTML = html;

    // --- Render Chart ---
    const canvas = document.getElementById('monthlyActivityChart');
    if (canvas){
        const ctx = canvas.getContext('2d');
        if (windowActivityChart) windowActivityChart.destroy();
        windowActivityChart = new Chart(ctx,{
            type:'line',
            data:{
                labels: chartLabels,
                datasets:[
                    {
                        label:'Actual Messages',
                        data: chartDataActual,
                        borderColor:'#4facfe',
                        backgroundColor:'rgba(79, 172, 254, 0.1)',
                        fill:true,
                        tension:0.3
                    },
                    {
                        label:'Predicted Messages',
                        data: chartDataForecast,
                        borderColor:'#f093fb',
                        backgroundColor:'rgba(240, 147, 251, 0.1)',
                        borderDash:[5,5],
                        fill:true,
                        tension:0.3
                    }
                ]
            },
            options:{
                responsive:true,
                plugins:{ legend:{display:true} },
                scales:{
                    x:{ title:{display:true, text:'Week'} },
                    y:{ title:{display:true, text:'Messages'}, beginAtZero:true }
                }
            }
        });
    }
}
