/**
 * GIST 250 Geoportal - Educational Metrics, Sensor Quality Comparison & RTK-GPS Inspector
 */

class MetricsDashboard {
    constructor(config) {
        this.config = config || {};
        this.usableDaysChart = null;
        this.ablationChart = null;
        this.transectProfileChart = null;
        this.transectProfiles = {};
    }

    init() {
        this.initUsableDaysChart();
        this.initAblationChart();
        this.initTransectProfileChart();
    }

    initUsableDaysChart() {
        const ctx = document.getElementById('cloud-cover-chart');
        if (!ctx) return;

        this.usableDaysChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Oct 23', 'Nov 23', 'Dec 23', 'Jan 24', 'Feb 24', 'Mar 24', 'Apr 24'],
                datasets: [
                    {
                        label: 'PlanetScope (3m)',
                        data: [11, 9, 12, 7, 7, 10, 6],
                        backgroundColor: '#005A9C',
                        borderRadius: 3
                    },
                    {
                        label: 'Sentinel-2 (10m)',
                        data: [3, 5, 3, 4, 5, 3, 3],
                        backgroundColor: '#00b5d8',
                        borderRadius: 3
                    },
                    {
                        label: 'Landsat 8/9 (30m)',
                        data: [1, 2, 1, 1, 2, 1, 1],
                        backgroundColor: '#a0aec0',
                        borderRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { boxWidth: 10, font: { size: 10 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: c => `${c.dataset.label}: ${c.parsed.y} usable days`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Usable Days / Month', font: { size: 10 } }
                    },
                    x: {
                        ticks: { font: { size: 10 } }
                    }
                }
            }
        });
    }

    initAblationChart() {
        const ctx = document.getElementById('change-events-chart');
        if (!ctx) return;

        this.ablationChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [
                    '0. Baseline (Global Otsu)',
                    '1A. + Slope Clamp (tan β ≥ 0.02)',
                    '1B/C. + ±50m Ref Buffer & Foam Mask'
                ],
                datasets: [
                    {
                        label: 'PlanetScope (3m) RMSE (m)',
                        data: [71.91, 62.42, 20.07],
                        backgroundColor: '#005A9C',
                        borderRadius: 4
                    },
                    {
                        label: 'Sentinel-2 (10m) RMSE (m)',
                        data: [40.72, 31.81, 19.08],
                        backgroundColor: '#00b5d8',
                        borderRadius: 4
                    },
                    {
                        label: 'Landsat 30m CA Lit. Benchmark',
                        data: [24.5, 24.5, 24.5],
                        backgroundColor: '#cbd5e0',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { boxWidth: 10, font: { size: 10 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: c => `${c.dataset.label}: ${c.parsed.y} m RMSE vs. RTK-GPS`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'MHW RMSE vs. Scripps RTK (m)', font: { size: 10 } }
                    },
                    x: {
                        ticks: { font: { size: 9 } }
                    }
                }
            }
        });
    }

    initTransectProfileChart() {
        const ctx = document.getElementById('transect-profile-chart');
        if (!ctx) return;

        this.transectProfileChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { boxWidth: 10, font: { size: 10 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: c => `${c.dataset.label}: ${c.parsed.y} m from origin`
                        }
                    }
                },
                scales: {
                    y: {
                        title: { display: true, text: 'MHW Cross-Shore Position (m)', font: { size: 10 } }
                    },
                    x: {
                        ticks: { font: { size: 9 } }
                    }
                }
            }
        });
    }

    updateMetrics(allData) {
        if (!allData) return;

        // 1. Update Usable Days Chart from step1Screening
        if (allData.step1Screening?.monthly_usable_days && this.usableDaysChart) {
            const m = allData.step1Screening.monthly_usable_days;
            this.usableDaysChart.data.labels = m.map(d => d.month);
            this.usableDaysChart.data.datasets[0].data = m.map(d => d.ps_scene_usable_days);
            this.usableDaysChart.data.datasets[1].data = m.map(d => d.s2_usable_days);
            this.usableDaysChart.data.datasets[2].data = m.map(d => d.landsat_est_usable_days);
            this.usableDaysChart.update();
        }

        // 2. Populate Sensor Comparison Table & Ablation Table
        if (allData.step6Metrics) {
            this.transectProfiles = allData.step6Metrics.transect_profiles || {};
            this.renderSensorComparisonTable(allData.step6Metrics.sensor_comparison || []);
            this.renderAblationTable(allData.step6Metrics.ablation_metrics || []);
            this.populateTransectSelector(Object.keys(this.transectProfiles));
        }
    }

    renderSensorComparisonTable(rows) {
        const tbody = document.getElementById('sensor-comparison-tbody');
        if (!tbody) return;
        tbody.innerHTML = rows
            .map(
                r => `
            <tr>
                <td><strong>${r.sensor}</strong></td>
                <td>${r.pixel_size_m} m</td>
                <td>${r.revisit_days} d</td>
                <td>${r.usable_scenes_winter}</td>
                <td><span class="rmse-pill">${r.oceanside_rmse_m}</span></td>
                <td>${r.role}<br><small style="color:#718096"><em>Note: ${r.limitation}</em></small></td>
            </tr>
        `
            )
            .join('');
    }

    renderAblationTable(rows) {
        const tbody = document.getElementById('ablation-tbody');
        if (!tbody) return;
        tbody.innerHTML = rows
            .map(
                r => `
            <tr>
                <td><strong>${r.sensor}</strong></td>
                <td>${r.stage}</td>
                <td>${r.n_pairs}</td>
                <td>${r.bias_mhw_m > 0 ? '+' : ''}${r.bias_mhw_m} m</td>
                <td><strong>${r.rmse_mhw_m} m</strong></td>
                <td>${r.mae_mhw_m} m</td>
            </tr>
        `
            )
            .join('');
    }

    populateTransectSelector(transectIds) {
        const sel = document.getElementById('transect-select');
        if (!sel || transectIds.length === 0) return;

        // Prioritize transects that have rich RTK + PS + S2 observations
        const preferred = 'CA_S017_T042';
        sel.innerHTML = transectIds
            .map(tid => {
                const prof = this.transectProfiles[tid];
                const nRtk = prof?.rtk_surveys?.length || 0;
                const nPs = prof?.ps_observations?.length || 0;
                const badge = nRtk > 0 ? ` (${nRtk} RTK, ${nPs} PS)` : '';
                return `<option value="${tid}" ${tid === preferred ? 'selected' : ''}>${tid}${badge}</option>`;
            })
            .join('');

        this.renderTransectInspector(sel.value || transectIds[0]);
    }

    renderTransectInspector(transectId) {
        const prof = this.transectProfiles[transectId];
        if (!prof) return;

        const sel = document.getElementById('transect-select');
        if (sel && sel.value !== transectId) sel.value = transectId;

        // Collect all unique dates across RTK, PS, S2
        const dateSet = new Set();
        (prof.rtk_surveys || []).forEach(r => dateSet.add(r.survey_date));
        (prof.ps_observations || []).forEach(r => dateSet.add(r.sat_date));
        (prof.s2_observations || []).forEach(r => dateSet.add(r.sat_date));
        const allDates = Array.from(dateSet).sort();

        const rtkMap = {};
        (prof.rtk_surveys || []).forEach(r => {
            rtkMap[r.survey_date] = r.insitu_mhw_m;
        });

        const psMap = {};
        (prof.ps_observations || []).forEach(r => {
            psMap[r.sat_date] = r.x_mhw_m;
        });

        const s2Map = {};
        (prof.s2_observations || []).forEach(r => {
            s2Map[r.sat_date] = r.x_mhw_m;
        });

        if (this.transectProfileChart) {
            this.transectProfileChart.data.labels = allDates;
            this.transectProfileChart.data.datasets = [
                {
                    label: 'Scripps RTK-GPS Truth (MHW)',
                    data: allDates.map(d => rtkMap[d] ?? null),
                    borderColor: '#d69e2e',
                    backgroundColor: '#FFCC00',
                    pointRadius: 5,
                    borderWidth: 2.5,
                    spanGaps: true
                },
                {
                    label: 'PlanetScope 3m (MHW)',
                    data: allDates.map(d => psMap[d] ?? null),
                    borderColor: '#005A9C',
                    backgroundColor: '#0077C4',
                    pointRadius: 5,
                    borderWidth: 2,
                    spanGaps: true
                },
                {
                    label: 'Sentinel-2 10m (MHW)',
                    data: allDates.map(d => s2Map[d] ?? null),
                    borderColor: '#00b5d8',
                    backgroundColor: '#00d2d3',
                    borderDash: [4, 3],
                    pointRadius: 4,
                    borderWidth: 2,
                    spanGaps: true
                },
                {
                    label: `Landsat/USGS Ref (x_ref = ${prof.usgs_ref_m ?? 'N/A'} m)`,
                    data: allDates.map(() => prof.usgs_ref_m ?? null),
                    borderColor: '#718096',
                    borderDash: [6, 6],
                    pointRadius: 0,
                    borderWidth: 1.5,
                    fill: false
                }
            ];
            this.transectProfileChart.update();
        }

        // Update RTK summary badges
        const elRef = document.getElementById('inspector-xref');
        const elSlope = document.getElementById('inspector-slope');
        const elExcursion = document.getElementById('inspector-excursion');
        if (elRef) elRef.textContent = prof.usgs_ref_m !== null ? `${prof.usgs_ref_m} m` : 'N/A';
        if (elSlope) elSlope.textContent = `tan β = ${prof.tan_beta_model}`;
        if (elExcursion) {
            elExcursion.textContent = prof.stl_seasonal_excursion_m ? `${prof.stl_seasonal_excursion_m} m` : 'N/A';
        }

        // Populate RTK-GPS measurements table for this transect
        const rtkTbody = document.getElementById('rtk-transect-tbody');
        if (rtkTbody) {
            const psBySurvey = {};
            (prof.ps_observations || []).forEach(p => {
                psBySurvey[p.survey_date] = p;
            });
            const s2BySurvey = {};
            (prof.s2_observations || []).forEach(s => {
                s2BySurvey[s.survey_date] = s;
            });

            if (!prof.rtk_surveys || prof.rtk_surveys.length === 0) {
                rtkTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#718096;">No direct RTK-GPS Wheelie profile recorded on this transect (click a highlighted transect such as CA_S017_T042, CA_S018_T001, or CA_S019_T001).</td></tr>`;
            } else {
                rtkTbody.innerHTML = prof.rtk_surveys
                    .map(r => {
                        const psMatch = psBySurvey[r.survey_date];
                        const s2Match = s2BySurvey[r.survey_date];
                        const psText = psMatch
                            ? `${psMatch.x_mhw_m} m <small>(${psMatch.res_mhw_m > 0 ? '+' : ''}${psMatch.res_mhw_m} m)</small>`
                            : '—';
                        const s2Text = s2Match
                            ? `${s2Match.x_mhw_m} m <small>(${s2Match.res_mhw_m > 0 ? '+' : ''}${s2Match.res_mhw_m} m)</small>`
                            : '—';
                        return `
                        <tr>
                            <td><strong>${r.survey_date}</strong></td>
                            <td><strong>${r.insitu_mhw_m} m</strong></td>
                            <td>${r.n_points} pts</td>
                            <td>${r.slope_tan_beta ?? '—'}</td>
                            <td>${psText}</td>
                            <td>${s2Text}</td>
                        </tr>
                    `;
                    })
                    .join('');
            }
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MetricsDashboard;
}
