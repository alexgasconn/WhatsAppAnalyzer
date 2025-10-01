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

    function getWeekKey(date) {
        const d = new Date(date);
        const firstDay = new Date(d.getFullYear(),0,1);
        const weekNo = Math.ceil((((d - firstDay)/86400000)+firstDay.getDay()+1)/7);
        return `${d.getFullYear()}-W${weekNo}`;
    }

    // --- Aggregate weekly counts ---
    const weeklyCounts = {};
    data.forEach(d => {
        const week = getWeekKey(d.datetime);
        weeklyCounts[week] = (weeklyCounts[week]||0)+1;
    });

    const sortedWeeks = Object.keys(weeklyCounts).sort();
    const countsArray = sortedWeeks.map(w => weeklyCounts[w]);

    // --- Detect seasonality ---
    function detectSeasonLength(arr) {
        if (arr.length < 8) return 1;
        let bestLen = 1, bestVar = Infinity;
        for (let len=1; len<=Math.min(12, Math.floor(arr.length/2)); len++){
            let seasonalMeans = [];
            for (let i=0;i<len;i++){
                let vals=[];
                for (let j=i;j<arr.length;j+=len) vals.push(arr[j]);
                seasonalMeans.push(vals.reduce((a,b)=>a+b,0)/vals.length);
            }
            let varSeason = seasonalMeans.reduce((a,b)=>a+b,0)/seasonalMeans.length;
            if (varSeason<bestVar){ bestVar=varSeason; bestLen=len;}
        }
        return bestLen;
    }
    const seasonLength = detectSeasonLength(countsArray);

    // --- Adaptive smoothing SARIMA ---
    function adaptiveSARIMA(arr, weeks=12, seasonLength=seasonLength) {
        if (!arr.length) return Array(weeks).fill(0);

        let forecast = [];
        let lastVal = arr[arr.length-1];
        let trend = arr.length >=2 ? (arr.slice(-seasonLength).reduce((a,b)=>a+b,0) - arr.slice(-2*seasonLength,-seasonLength).reduce((a,b)=>a+b,0))/seasonLength : 0;

        // Compute seasonality pattern
        let seasonals = [];
        for (let i=0;i<seasonLength;i++){
            let vals=[];
            for (let j=i;j<arr.length;j+=seasonLength) vals.push(arr[j]);
            seasonals.push(vals.reduce((a,b)=>a+b,0)/vals.length - arr.reduce((a,b)=>a+b,0)/arr.length);
        }

        for (let i=0;i<weeks;i++){
            const seasonal = seasonals[i%seasonLength] || 0;

            // Adaptive alpha: larger if last week deviates strongly
            const deviation = arr.length>0 ? Math.abs(arr[arr.length-1]-arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
            const alpha = Math.min(0.9, 0.3 + 0.7*Math.min(1,deviation/Math.max(1,arr.reduce((a,b)=>a+b,0)/arr.length)));

            const nextVal = lastVal + trend + seasonal;
            const smoothed = alpha*nextVal + (1-alpha)*lastVal;

            forecast.push(Math.round(smoothed));

            // Update lastVal and trend dynamically
            trend = 0.7*trend + 0.3*(smoothed - lastVal);
            lastVal = smoothed;
        }
        return forecast;
    }

    const forecastWeeks = 12;
    const forecastValues = adaptiveSARIMA(countsArray, forecastWeeks);

    // --- Forecast week labels ---
    const lastWeekParts = sortedWeeks[sortedWeeks.length-1].split('-W');
    let lastYear = parseInt(lastWeekParts[0]);
    let lastWeekNo = parseInt(lastWeekParts[1]);
    const forecastLabels = [];
    for (let i=1;i<=forecastWeeks;i++){
        lastWeekNo++;
        let year = lastYear;
        let week = lastWeekNo;
        if (week>52){ week-=52; year+=1;}
        forecastLabels.push(`${year}-W${week}`);
    }

    const chartLabels = [...sortedWeeks,...forecastLabels];
    const chartDataActual = [...countsArray,...Array(forecastWeeks).fill(null)];
    const chartDataForecast = [...Array(sortedWeeks.length).fill(null),...forecastValues];

    // --- Top user + per-user forecasts ---
    const userCounts = {};
    data.forEach(d=>userCounts[d.user]=(userCounts[d.user]||0)+1);
    const topUser = Object.entries(userCounts).sort((a,b)=>b[1]-a[1])[0];

    const users=[...new Set(data.map(d=>d.user))];
    const userForecasts={};
    users.forEach(u=>{
        const userWeeks={};
        data.filter(d=>d.user===u).forEach(d=>{
            const w=getWeekKey(d.datetime);
            userWeeks[w]=(userWeeks[w]||0)+1;
        });
        const arr=Object.keys(userWeeks).sort().map(k=>userWeeks[k]);
        const f=adaptiveSARIMA(arr, forecastWeeks);
        userForecasts[u]=f;
    });

    // --- Render HTML ---
    container.innerHTML = `
        <h2>Chat Predictions & Insights (Weekly - Adaptive SARIMA)</h2>
        <div class="prediction-card">
            <h4>Most Talkative User</h4>
            <div>${topUser ? topUser[0] : 'N/A'} (${topUser ? topUser[1] : 0} msgs)</div>
        </div>
        <h3>🔮 Weekly Forecast (Next ${forecastWeeks} Weeks)</h3>
        <div class="relationship-grid">
            <div class="relationship-card">
                <h4>Group Forecast</h4>
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
            <h3>📊 Weekly Messages: Actual vs Predicted (Adaptive)</h3>
            <canvas id="monthlyActivityChart" width="800" height="400"></canvas>
        </div>
    `;

    // --- Render Chart ---
    const canvas=document.getElementById('monthlyActivityChart');
    if(canvas){
        const ctx=canvas.getContext('2d');
        if(windowActivityChart) windowActivityChart.destroy();
        windowActivityChart=new Chart(ctx,{
            type:'line',
            data:{
                labels:chartLabels,
                datasets:[
                    {
                        label:'Actual Messages',
                        data:chartDataActual,
                        borderColor:'#4facfe',
                        backgroundColor:'rgba(79,172,254,0.1)',
                        fill:true,
                        tension:0.3
                    },
                    {
                        label:'Predicted Messages',
                        data:chartDataForecast,
                        borderColor:'#f093fb',
                        backgroundColor:'rgba(240,147,251,0.1)',
                        borderDash:[5,5],
                        fill:true,
                        tension:0.3
                    }
                ]
            },
            options:{
                responsive:true,
                plugins:{legend:{display:true}},
                scales:{
                    x:{title:{display:true,text:'Week'}},
                    y:{title:{display:true,text:'Messages'},beginAtZero:true}
                }
            }
        });
    }
}
