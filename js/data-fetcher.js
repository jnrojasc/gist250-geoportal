/**
 * GIST 250 Geoportal - Data Fetcher
 * Loads all 8 pipeline geographical products, Landsat/S2/PS comparisons, and Scripps RTK-GPS datasets
 */

class DataFetcher {
    constructor(projectId = 'gen-lang-client-247188733') {
        this.projectId = projectId;
        this.baseUrl = window.location.origin + window.location.pathname.replace(/\/index\.html$/, '');
        if (!this.baseUrl.endsWith('/')) this.baseUrl += '/';
    }

    async fetchJson(relativePath) {
        const response = await fetch(`${this.baseUrl}${relativePath}`);
        if (!response.ok) throw new Error(`HTTP ${response.status} for ${relativePath}`);
        return await response.json();
    }

    async fetchAllEducationalProducts() {
        const [
            beachPolygons,
            shorelineTransects,
            cloudCoverData,
            changeEvents,
            step1Screening,
            step2Coreg,
            step3RefBuffer,
            step4RawWaterlines,
            step5TidalCorrection,
            step6RtkValidation,
            step6Metrics,
            step7ChangeRates,
            step8Hotspots
        ] = await Promise.all([
            this.fetchJson('data/oceanside_roi.geojson'),
            this.fetchJson('data/oceanside_transects.geojson'),
            this.fetchJson('data/cloud_cover_monthly.json'),
            this.fetchJson('data/oceanside_events.json'),
            this.fetchJson('data/step1_screening.json'),
            this.fetchJson('data/step2_coregistration.geojson'),
            this.fetchJson('data/step3_ref_buffer.geojson'),
            this.fetchJson('data/step4_raw_waterlines.geojson'),
            this.fetchJson('data/step5_tidal_correction.geojson'),
            this.fetchJson('data/step6_rtk_validation.geojson'),
            this.fetchJson('data/step6_validation_metrics.json'),
            this.fetchJson('data/step7_change_rates.geojson'),
            this.fetchJson('data/step8_impact_hotspots.geojson')
        ]);

        return {
            timestamp: new Date().toISOString(),
            beachPolygons,
            shorelineTransects,
            cloudCoverData,
            changeEvents,
            step1Screening,
            step2Coreg,
            step3RefBuffer,
            step4RawWaterlines,
            step5TidalCorrection,
            step6RtkValidation,
            step6Metrics,
            step7ChangeRates,
            step8Hotspots,
            cloudMask: this.generateCloudMaskGeoJSON()
        };
    }

    generateCloudMaskGeoJSON() {
        return {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        name: 'Marine Layer / Cloud Screening Audit Zone',
                        coverage: 18,
                        status: 'UDM2 Clear Sky >= 85% & Beach Coverage >= 90%',
                        accuracy: '100% (40/40 audited scenes)'
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
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataFetcher;
}
