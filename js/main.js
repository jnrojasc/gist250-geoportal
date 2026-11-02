/**
 * GIST 250 Geoportal - Main Application
 * Application controller and event coordinator
 */

class GeoportalApp {
    constructor() {
        this.config = this.loadConfig();
        this.mapInstance = null;
        this.dataFetcher = null;
        this.metricsDashboard = null;
        this.pipelineExplainer = null;
        this.lastLoadedData = null;
        this.isMobile = false;
        
        this.init();
    }
    
    loadConfig() {
        return {
            geeProjectId: 'gen-lang-client-247188733',
            location: {
                name: 'Oceanside, California',
                lat: 33.190,
                lng: -117.382,
                zoom: 14
            },
            updateFrequency: 'weekly',
            primaryData: 'PlanetScope (~3m)',
            backupData: 'Sentinel-2 (10m)',
            githubRepo: 'https://github.com/jnrojasc/gist250-geoportal',
            branding: {
                title: 'GIST 250 Coastal Geoportal',
                logo: 'assets/logo.png',
                colors: {
                    primary: '#005A9C',
                    secondary: '#0077C4'
                }
            }
        };
    }
    
    init() {
        console.log('GIST 250 Geoportal initializing for Oceanside, CA...');
        this.checkMobile();
        
        // 1. Initialize Map
        this.mapInstance = new GeoportalMap(
            [this.config.location.lat, this.config.location.lng],
            this.config.location.zoom
        );
        
        // 2. Initialize Narrative & Explainer
        this.pipelineExplainer = new PipelineExplainer();
        
        // 3. Initialize Metrics Dashboard
        this.metricsDashboard = new MetricsDashboard(this.config);
        this.metricsDashboard.init();
        
        // 4. Initialize Data Fetcher
        this.dataFetcher = new DataFetcher(this.config.geeProjectId);
        
        // 5. Setup UI Event Listeners
        this.initEventListeners();
        
        // 6. Initial Data Load
        this.refreshData();
    }
    
    checkMobile() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 900;
    }
    
    initEventListeners() {
        // Refresh data button
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
        
        // Toggle technical mode
        const techBtn = document.getElementById('toggle-technical');
        if (techBtn) {
            techBtn.addEventListener('click', () => {
                const mode = this.pipelineExplainer.toggleViewMode();
                techBtn.textContent = mode === 'full' ? '⚙️ Simple View' : '⚙️ Technical View';
            });
        }
        
        // Download GeoJSON
        const dlGeoBtn = document.getElementById('download-geojson');
        if (dlGeoBtn) {
            dlGeoBtn.addEventListener('click', () => this.downloadGeoJSON());
        }
        
        // Download CSV
        const dlCsvBtn = document.getElementById('download-csv');
        if (dlCsvBtn) {
            dlCsvBtn.addEventListener('click', () => this.downloadCSV());
        }
        
        // Mobile sidebar toggle
        const toggleBtn = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('active');
            });
            
            document.addEventListener('click', (e) => {
                if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            });
        }
    }
    
    async refreshData() {
        const btn = document.getElementById('refresh-data');
        if (btn) {
            btn.innerHTML = '<span class="spinner"></span> Querying Assets...';
            btn.disabled = true;
        }
        
        try {
            const data = await this.dataFetcher.fetchPlanetScopeData();
            this.lastLoadedData = data;
            
            // Update map layers
            if (data.beachPolygons) {
                const beachL = this.mapInstance.setBeachLayer(data.beachPolygons);
                // Optionally fit map to beach bounds on initial load
                if (beachL) this.mapInstance.fitToBounds(beachL);
            }
            
            if (data.shorelineTransects) {
                this.mapInstance.setTransectsLayer(data.shorelineTransects);
            }
            
            if (data.cloudMask) {
                this.mapInstance.setCloudMaskLayer(data.cloudMask);
            }
            
            // Update metrics dashboard
            if (this.metricsDashboard) {
                this.metricsDashboard.updateMetrics(data);
            }
            
            this.updateLastUpdateDate();
            console.log('Geoportal data refresh complete.');
        } catch (error) {
            console.error('Error refreshing geoportal data:', error);
        } finally {
            if (btn) {
                btn.innerHTML = '🔄 Refresh Data (Weekly)';
                btn.disabled = false;
            }
        }
    }
    
    downloadGeoJSON() {
        if (!this.lastLoadedData) return;
        
        const exportCollection = {
            type: 'FeatureCollection',
            name: 'oceanside_coastal_monitoring_export',
            metadata: {
                project: 'GIST 250 - Oceanside El Niño Monitoring',
                author: 'James Rojas (jnrojasc)',
                timestamp: new Date().toISOString(),
                sensor_primary: 'PlanetScope',
                sensor_baseline: 'Sentinel-2',
                crs: 'EPSG:4326'
            },
            features: [
                ...(this.lastLoadedData.beachPolygons?.features || []),
                ...(this.lastLoadedData.shorelineTransects?.features || [])
            ]
        };
        
        this.triggerDownload(
            JSON.stringify(exportCollection, null, 2),
            'application/json',
            'oceanside-shoreline-monitoring.geojson'
        );
    }
    
    downloadCSV() {
        const events = this.lastLoadedData?.changeEvents || [];
        const rows = [
            ['Event ID', 'Type', 'Pre Event Date', 'Trough Date', 'Drop (m)', 'Recovered', 'Recovery Date', 'Sensors']
        ];
        
        events.forEach(e => {
            rows.push([
                e.id || 'EVT',
                e.type || (e.recovered ? 'recovery' : 'retreat'),
                e.preDate || '',
                e.troughDate || e.date || '',
                (e.dropMeters !== undefined ? e.dropMeters : '').toString(),
                e.recovered ? 'Yes' : 'No',
                e.recoveryDate || 'Unrecovered',
                `${e.preSensor || 'PlanetScope'} / ${e.troughSensor || 'Sentinel-2'}`
            ]);
        });
        
        const csvContent = rows.map(r => r.map(field => `"${field}"`).join(',')).join('\n');
        this.triggerDownload(csvContent, 'text/csv;charset=utf-8;', 'oceanside-elnino-events.csv');
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
            const now = new Date();
            dateEl.textContent = now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
            });
        }
    }
}

// Instantiate app once DOM is ready
let geoportalApp;
document.addEventListener('DOMContentLoaded', () => {
    geoportalApp = new GeoportalApp();
});
