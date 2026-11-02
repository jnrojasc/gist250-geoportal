/**
 * GIST 250 Geoportal - Metrics Dashboard
 * Handles Chart.js visualization for cloud cover and coastal change events
 */

class MetricsDashboard {
    constructor(config) {
        this.config = config || {};
        this.cloudCoverChart = null;
        this.changeEventsChart = null;
    }
    
    init() {
        const cloudCtx = document.getElementById('cloud-cover-chart');
        const eventsCtx = document.getElementById('change-events-chart');
        
        if (cloudCtx) {
            this.cloudCoverChart = new Chart(cloudCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Avg Cloud Cover (%)',
                        data: [],
                        borderColor: '#005A9C',
                        backgroundColor: 'rgba(0, 90, 156, 0.12)',
                        borderWidth: 2,
                        tension: 0.35,
                        fill: true,
                        pointBackgroundColor: '#005A9C',
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: context => `${context.parsed.y}% cloud cover`
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                stepSize: 20,
                                callback: val => `${val}%`
                            },
                            grid: { color: '#e2e8f0' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }
        
        if (eventsCtx) {
            this.changeEventsChart = new Chart(eventsCtx, {
                type: 'bar',
                data: {
                    labels: ['Retreat Events', 'Recovery Events'],
                    datasets: [{
                        label: 'Events Count',
                        data: [0, 0],
                        backgroundColor: ['#dc3545', '#28a745'],
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 },
                            grid: { color: '#e2e8f0' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }
    }
    
    updateCloudCover(data) {
        if (!this.cloudCoverChart) return;
        const list = Array.isArray(data) ? data : (data?.cloudCoverData || []);
        if (list.length === 0) return;
        
        this.cloudCoverChart.data.labels = list.map(d => d.month || '');
        this.cloudCoverChart.data.datasets[0].data = list.map(d => d.cloudCover ?? 0);
        this.cloudCoverChart.update();
        
        // Update metric chip if exists
        const avgVal = (list.reduce((acc, curr) => acc + (curr.cloudCover || 0), 0) / list.length).toFixed(1);
        const chip = document.getElementById('metric-avg-cloud');
        if (chip) chip.textContent = `${avgVal}%`;
    }
    
    updateChangeEvents(data) {
        if (!this.changeEventsChart) return;
        const list = Array.isArray(data) ? data : (data?.changeEvents || []);
        if (list.length === 0) return;
        
        const retreatCount = list.filter(e => e.type === 'retreat' || !e.recovered).length;
        const recoveryCount = list.filter(e => e.type === 'recovery' || e.recovered).length;
        
        this.changeEventsChart.data.datasets[0].data = [retreatCount, recoveryCount];
        this.changeEventsChart.update();
        
        // Update metric chips if exist
        const totalChip = document.getElementById('metric-total-events');
        if (totalChip) totalChip.textContent = list.length;
        const recChip = document.getElementById('metric-recovery-rate');
        if (recChip) {
            const pct = Math.round((recoveryCount / list.length) * 100);
            recChip.textContent = `${pct}%`;
        }
    }
    
    updateMetrics(data) {
        if (!data) return;
        if (data.cloudCoverData || Array.isArray(data)) this.updateCloudCover(data);
        if (data.changeEvents) this.updateChangeEvents(data.changeEvents);
    }
}

// Global export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MetricsDashboard;
}
