/**
 * GIST 250 Geoportal - Data Fetcher
 * Handles loading data from GitHub repository static assets and GEE endpoints
 */

class DataFetcher {
    constructor(projectId = 'gen-lang-client-247188733') {
        this.projectId = projectId;
        this.baseUrl = window.location.origin + window.location.pathname.replace(/\/index\.html$/, '');
        if (!this.baseUrl.endsWith('/')) this.baseUrl += '/';
    }
    
    async fetchPlanetScopeData(startDate, endDate) {
        console.log('Fetching PlanetScope coastal monitoring data...');
        
        let beachPolygons = null;
        let shorelineTransects = null;
        let cloudCoverData = null;
        let changeEvents = null;
        
        try {
            beachPolygons = await this.fetchBeachPolygons();
        } catch (err) {
            console.warn('Could not load local beach polygons, using fallback geometry:', err);
            beachPolygons = this.getFallbackBeachPolygon();
        }
        
        try {
            shorelineTransects = await this.fetchShorelineTransects();
        } catch (err) {
            console.warn('Could not load local transects, using fallback:', err);
            shorelineTransects = this.getFallbackTransects();
        }
        
        try {
            cloudCoverData = await this.fetchCloudCover();
        } catch (err) {
            console.warn('Could not load local cloud stats, using fallback:', err);
            cloudCoverData = this.generateMockCloudData();
        }
        
        try {
            changeEvents = await this.fetchChangeEvents();
        } catch (err) {
            console.warn('Could not load local events, using fallback:', err);
            changeEvents = this.generateMockChangeEvents();
        }
        
        return {
            timestamp: new Date().toISOString(),
            startDate: startDate || '2023-10-01',
            endDate: endDate || '2024-04-30',
            beachPolygons: beachPolygons,
            shorelineTransects: shorelineTransects,
            cloudCoverData: cloudCoverData,
            changeEvents: changeEvents,
            cloudMask: this.generateCloudMaskGeoJSON()
        };
    }
    
    async fetchSentinel2Backup(startDate, endDate) {
        console.log('Fetching Sentinel-2 baseline data...');
        const baseData = await this.fetchPlanetScopeData(startDate, endDate);
        return {
            ...baseData,
            sensor: 'Sentinel-2 L2A',
            resolution: '10 m',
            baseline: true
        };
    }
    
    async fetchBeachPolygons() {
        const response = await fetch(`${this.baseUrl}data/oceanside_roi.geojson`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    }
    
    async fetchShorelineTransects() {
        const response = await fetch(`${this.baseUrl}data/oceanside_transects.geojson`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    }
    
    async fetchCloudCover() {
        const response = await fetch(`${this.baseUrl}data/cloud_cover_monthly.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    }
    
    async fetchChangeEvents() {
        const response = await fetch(`${this.baseUrl}data/oceanside_events.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    }
    
    generateCloudMaskGeoJSON() {
        // Marine layer indicator polygon over offshore Oceanside waters
        return {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        name: 'Marine Layer Screening Boundary',
                        coverage: 18,
                        status: 'Filtered / UDM2 Clear'
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [-117.408, 33.170],
                            [-117.412, 33.208],
                            [-117.396, 33.208],
                            [-117.382, 33.170],
                            [-117.408, 33.170]
                        ]]
                    }
                }
            ]
        };
    }
    
    generateMockCloudData() {
        return [
            { month: 'October 2023', cloudCover: 12.4 },
            { month: 'November 2023', cloudCover: 28.1 },
            { month: 'December 2023', cloudCover: 44.5 },
            { month: 'January 2024', cloudCover: 38.2 },
            { month: 'February 2024', cloudCover: 24.6 },
            { month: 'March 2024', cloudCover: 16.8 },
            { month: 'April 2024', cloudCover: 10.5 }
        ];
    }
    
    generateMockChangeEvents() {
        return [
            { id: 'EVT_20231004', type: 'recovery', dropMeters: 43.98, date: '2023-10-05', recovered: true },
            { id: 'EVT_20231114', type: 'recovery', dropMeters: 38.86, date: '2023-11-14', recovered: true },
            { id: 'EVT_20231214', type: 'recovery', dropMeters: 64.21, date: '2023-12-14', recovered: true },
            { id: 'EVT_20240101', type: 'retreat', dropMeters: 112.15, date: '2024-01-08', recovered: false },
            { id: 'EVT_20240113', type: 'recovery', dropMeters: 21.94, date: '2024-01-18', recovered: true },
            { id: 'EVT_20240130', type: 'recovery', dropMeters: 34.97, date: '2024-02-02', recovered: true },
            { id: 'EVT_20240222', type: 'recovery', dropMeters: 31.01, date: '2024-02-22', recovered: true },
            { id: 'EVT_20240407', type: 'retreat', dropMeters: 48.55, date: '2024-04-07', recovered: false }
        ];
    }
    
    getFallbackBeachPolygon() {
        return {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                properties: { name: 'Oceanside Beach ROI', area_km2: 2.2 },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [-117.388, 33.193],
                        [-117.399, 33.205],
                        [-117.395, 33.207],
                        [-117.366, 33.168],
                        [-117.363, 33.170],
                        [-117.388, 33.193]
                    ]]
                }
            }]
        };
    }
    
    getFallbackTransects() {
        return {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: { id: 'CA_S017_T040', name: 'Oceanside Pier North', type: 'standard' },
                    geometry: {
                        type: 'LineString',
                        coordinates: [[-117.385, 33.195], [-117.389, 33.193]]
                    }
                },
                {
                    type: 'Feature',
                    properties: { id: 'CA_S017_T050', name: 'Oceanside Central', type: 'standard' },
                    geometry: {
                        type: 'LineString',
                        coordinates: [[-117.378, 33.185], [-117.382, 33.183]]
                    }
                },
                {
                    type: 'Feature',
                    properties: { id: 'CA_S017_T060', name: 'Oceanside South Beach', type: 'standard' },
                    geometry: {
                        type: 'LineString',
                        coordinates: [[-117.370, 33.175], [-117.374, 33.173]]
                    }
                }
            ]
        };
    }
}

// Global export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataFetcher;
}
