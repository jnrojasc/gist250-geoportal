/**
 * GIST 250 Geoportal - Main Educational Application Controller
 * Coordinates the 8-Step Geographical Product Explorer, Sensor Quality Comparison & RTK-GPS Inspector
 */

class GeoportalApp {
    constructor() {
        this.config = {
            geeProjectId: 'gen-lang-client-247188733',
            location: {
                name: 'Oceanside, California',
                lat: 33.189,
                lng: -117.381,
                zoom: 14
            },
            githubRepo: 'https://github.com/jnrojasc/gist250-geoportal'
        };
        this.mapInstance = null;
        this.dataFetcher = null;
        this.metricsDashboard = null;
        this.pipelineExplainer = null;
        this.lastLoadedData = null;
        this.currentSurveyDate = '2024-02-09';
        this.init();
    }

    init() {
        // 1. Initialize Map with Transect Click callback
        this.mapInstance = new GeoportalMap(
            [this.config.location.lat, this.config.location.lng],
            this.config.location.zoom,
            transectId => this.handleTransectSelection(transectId, true)
        );

        // 2. Initialize 8-Step Pipeline Explainer with Step Click callback
        this.pipelineExplainer = new PipelineExplainer(stepObj => {
            if (this.lastLoadedData) {
                this.mapInstance.activateStepProduct(stepObj, this.lastLoadedData, this.currentSurveyDate);
            }
        });
        this.pipelineExplainer.renderSteps();

        // 3. Initialize Metrics & Validation Dashboard
        this.metricsDashboard = new MetricsDashboard(this.config);
        this.metricsDashboard.init();

        // 4. Initialize Data Fetcher
        this.dataFetcher = new DataFetcher(this.config.geeProjectId);

        // 5. Setup UI Listeners (Tabs, Dropdowns, Buttons)
        this.initEventListeners();

        // 6. Load All Educational Products
        this.refreshData();

        // Invalidate map size on window load and after slight delay
        window.addEventListener('load', () => {
            setTimeout(() => { if (this.mapInstance && this.mapInstance.map) this.mapInstance.map.invalidateSize(); }, 300);
        });
    }

    initEventListeners() {
        // Sidebar Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-tab');
                this.switchTab(targetId);
            });
        });

        // Quick Step Buttons in floating map bar
        document.querySelectorAll('.quick-step-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const stepNum = parseInt(btn.getAttribute('data-step'), 10);
                this.selectStep(stepNum);
            });
        });

        // Survey Date selector for Step 6 validation overlay
        const surveySel = document.getElementById('survey-date-select');
        if (surveySel) {
            surveySel.addEventListener('change', e => {
                this.currentSurveyDate = e.target.value;
                this.pipelineExplainer.setActiveStep(6);
                this.syncQuickStepButtons(6);
            });
        }

        // Transect selector dropdown in RTK Inspector
        const transectSel = document.getElementById('transect-select');
        if (transectSel) {
            transectSel.addEventListener('change', e => {
                this.handleTransectSelection(e.target.value, false);
            });
        }

        // QA Figure switcher
        const figSel = document.getElementById('qa-figure-select');
        const figImg = document.getElementById('qa-figure-img');
        const figLink = document.getElementById('qa-figure-link');
        const figCaption = document.getElementById('qa-figure-caption');
        if (figSel && figImg) {
            figSel.addEventListener('change', e => {
                const opt = e.target.selectedOptions[0];
                const relUrl = `assets/figures/${e.target.value}`;
                figImg.src = relUrl;
                if (figLink) figLink.href = relUrl;
                if (figCaption && opt) {
                    figCaption.textContent = opt.getAttribute('data-caption') || '';
                }
            });
        }

        // Refresh data button
        document.getElementById('refresh-data')?.addEventListener('click', () => this.refreshData());

        // Toggle technical details
        const techBtn = document.getElementById('toggle-technical');
        if (techBtn) {
            techBtn.addEventListener('click', () => {
                const mode = this.pipelineExplainer.toggleViewMode();
                techBtn.textContent = mode === 'full' ? '⚙️ Hide Tech Notes' : '⚙️ Show Tech Notes';
            });
        }

        // Export buttons
        document.getElementById('download-geojson')?.addEventListener('click', () => this.downloadGeoJSON());
        document.getElementById('download-csv')?.addEventListener('click', () => this.downloadCSV());

        // Mobile sidebar toggle
        const toggleBtn = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', e => {
                e.stopPropagation();
                sidebar.classList.toggle('active');
            });
        }
    }

    switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
        });
        document.querySelectorAll('.tab-pane').forEach(p => {
            p.classList.toggle('active', p.id === tabId);
        });
        if (this.mapInstance && this.mapInstance.map) {
            this.mapInstance.map.invalidateSize();
        }
    }

    selectStep(stepNum) {
        this.pipelineExplainer.setActiveStep(stepNum);
        this.syncQuickStepButtons(stepNum);
        const card = document.getElementById(`pipeline-step-${stepNum}`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    syncQuickStepButtons(stepNum) {
        document.querySelectorAll('.quick-step-btn').forEach(b => {
            b.classList.toggle('active', parseInt(b.getAttribute('data-step'), 10) === stepNum);
        });
    }

    handleTransectSelection(transectId, switchToRtkTab = false) {
        if (!transectId || !this.lastLoadedData) return;
        this.mapInstance.highlightTransect(transectId, this.lastLoadedData.shorelineTransects);
        this.metricsDashboard.renderTransectInspector(transectId);
        if (switchToRtkTab) {
            this.switchTab('tab-rtk');
        }
    }

    async refreshData() {
        const btn = document.getElementById('refresh-data');
        if (btn) {
            btn.innerHTML = '<span class="spinner"></span> Loading...';
            btn.disabled = true;
        }

        try {
            const data = await this.dataFetcher.fetchAllEducationalProducts();
            this.lastLoadedData = data;

            // Render base 55 USGS transects
            this.mapInstance.renderBaseTransects(data.shorelineTransects);

            // Activate current step product on map (default Step 6: 4-Way Validation)
            const activeStepObj = this.pipelineExplainer.getStep(this.pipelineExplainer.activeStep);
            this.mapInstance.activateStepProduct(activeStepObj, data, this.currentSurveyDate);
            this.syncQuickStepButtons(this.pipelineExplainer.activeStep);

            // Fit bounds to Oceanside ROI
            if (data.beachPolygons) {
                this.mapInstance.fitToBounds(data.beachPolygons);
            }

            // Populate charts, tables, and RTK inspector
            this.metricsDashboard.updateMetrics(data);
            this.mapInstance.highlightTransect('CA_S017_T042', data.shorelineTransects);

            this.updateLastUpdateDate();
        } catch (error) {
            console.error('Error loading educational products:', error);
        } finally {
            if (btn) {
                btn.innerHTML = '🔄 Reload Products';
                btn.disabled = false;
            }
        }
    }

    downloadGeoJSON() {
        if (!this.lastLoadedData) return;
        const stepNum = this.pipelineExplainer.activeStep;
        const mapByStep = {
            1: this.lastLoadedData.beachPolygons,
            2: this.lastLoadedData.step2Coreg,
            3: this.lastLoadedData.step3RefBuffer,
            4: this.lastLoadedData.step4RawWaterlines,
            5: this.lastLoadedData.step5TidalCorrection,
            6: this.lastLoadedData.step6RtkValidation,
            7: this.lastLoadedData.step7ChangeRates,
            8: this.lastLoadedData.step8Hotspots
        };
        const payload = mapByStep[stepNum] || this.lastLoadedData.step6RtkValidation;
        this.triggerDownload(
            JSON.stringify(payload, null, 2),
            'application/json',
            `oceanside-step${stepNum}-product.geojson`
        );
    }

    downloadCSV() {
        if (!this.lastLoadedData?.step6Metrics?.ablation_metrics) return;
        const rows = [
            ['Sensor', 'Pipeline Stage', 'N Pairs vs RTK', 'Bias Raw (m)', 'RMSE Raw (m)', 'Bias MHW (m)', 'RMSE MHW (m)', 'MAE MHW (m)']
        ];
        this.lastLoadedData.step6Metrics.ablation_metrics.forEach(r => {
            rows.push([
                r.sensor,
                r.stage,
                r.n_pairs,
                r.bias_raw_m,
                r.rmse_raw_m,
                r.bias_mhw_m,
                r.rmse_mhw_m,
                r.mae_mhw_m
            ]);
        });
        const csvContent = rows.map(r => r.map(f => `"${f}"`).join(',')).join('\n');
        this.triggerDownload(csvContent, 'text/csv;charset=utf-8;', 'oceanside-multisensor-rtk-validation.csv');
    }

    triggerDownload(content, mimeType, filename) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    updateLastUpdateDate() {
        const dateEl = document.getElementById('last-update');
        if (dateEl) {
            dateEl.textContent = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }
}

let geoportalApp;
document.addEventListener('DOMContentLoaded', () => {
    geoportalApp = new GeoportalApp();
});
