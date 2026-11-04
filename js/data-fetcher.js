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
        try {
            const sep = relativePath.includes('?') ? '&' : '?';
            const response = await fetch(`${this.baseUrl}${relativePath}${sep}v=4.0.0`, { cache: 'no-store' });
            if (!response.ok) {
                console.warn(`[DataFetcher] Warning: HTTP ${response.status} loading ${relativePath}`);
                return null;
            }
            return await response.json();
        } catch (err) {
            console.error(`[DataFetcher] Network error loading ${relativePath}:`, err);
            return null;
        }
    }

    async fetchAllEducationalProducts() {
        const files = [
            { key: 'beachPolygons', path: 'data/oceanside_roi.geojson' },
            { key: 'shorelineTransects', path: 'data/oceanside_transects.geojson' },
            { key: 'cloudCoverData', path: 'data/cloud_cover_monthly.json' },
            { key: 'changeEvents', path: 'data/oceanside_events.json' },
            { key: 'step1Screening', path: 'data/step1_screening.json' },
            { key: 'step2Coreg', path: 'data/step2_coregistration.geojson' },
            { key: 'step3RefBuffer', path: 'data/step3_ref_buffer.geojson' },
            { key: 'step4RawWaterlines', path: 'data/step4_raw_waterlines.geojson' },
            { key: 'step5TidalCorrection', path: 'data/step5_tidal_correction.geojson' },
            { key: 'step6RtkValidation', path: 'data/step6_rtk_validation.geojson' },
            { key: 'step6Metrics', path: 'data/step6_validation_metrics.json' },
            { key: 'step7ChangeRates', path: 'data/step7_change_rates.geojson' },
            { key: 'step8Hotspots', path: 'data/step8_impact_hotspots.geojson' }
        ];

        const results = await Promise.allSettled(
            files.map(f => this.fetchJson(f.path))
        );

        const dataObj = {
            timestamp: new Date().toISOString(),
            cloudMask: this.generateCloudMaskGeoJSON()
        };

        const failedFiles = [];
        files.forEach((f, idx) => {
            const res = results[idx];
            if (res.status === 'fulfilled' && res.value !== null) {
                dataObj[f.key] = res.value;
            } else {
                dataObj[f.key] = null;
                failedFiles.push(f.path);
            }
        });

        if (failedFiles.length > 0) {
            console.warn(`[DataFetcher] Non-critical degraded load: ${failedFiles.length} file(s) unavailable:`, failedFiles);
        }

        return dataObj;
    }

    generateCloudMaskGeoJSON() {
        // Representative/pedagogical screening audit zone for Step 1 educational demonstration
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
