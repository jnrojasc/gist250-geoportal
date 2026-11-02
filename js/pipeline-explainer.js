/**
 * GIST 250 Geoportal - 8-Step Educational Pipeline & Geographical Product Explorer
 * Maps each step of the processing chain to its geographical product on the map
 */

class PipelineExplainer {
    constructor(onStepSelect) {
        this.onStepSelect = onStepSelect;
        this.currentMode = 'full';
        this.activeStep = 6; // Default to Step 6 (4-Way Validation overlay) or Step 1
        this.steps = [
            {
                number: 1,
                title: '1. Acquire + Screen',
                tool: 'Planet API · UDM2 cloud/haze mask',
                whatWeAdd: 'Empirical UDM2 usability audit for CA coastal marine layer',
                geoProductTitle: 'Oceanside ROI Chip Boundary & UDM2 Usable-Scene Footprint',
                geoProductExplanation: 'Shows the exact 2.20 km² coastal Region of Interest (ROI) polygon used to clip scenes in the cloud (avoiding 300 MB full-scene downloads) and the offshore marine-layer screening audit zone.',
                technical: 'Requires UDM2 clear_fraction >= 0.85 and ROI coverage >= 0.90. Yields 62 usable PlanetScope days (7–12/mo) vs. 26 Sentinel-2 days (3–5/mo) and ~7 Landsat days during the 2023–24 El Niño winter (100% agreement across 40 human-audited scenes).'
            },
            {
                number: 2,
                title: '2. Co-registration',
                tool: 'AROSICS local (Scheffler et al.)',
                whatWeAdd: 'Local tie-point co-registration default, not global shift',
                geoProductTitle: 'Local Sub-Pixel Tie-Point Shift Vectors (dx, dy)',
                geoProductExplanation: 'Displays a grid of local co-registration vectors anchored on stable back-beach infrastructure (Strand Way seawall, riprap, harbor jetties) that correct 1–3 m geometric jitter between PlanetScope Dove sensors.',
                technical: '128x128 px local Fourier phase-correlation windows align each PlanetScope ROI chip to the Sentinel-2 / NAIP orthorectified base (post-coregistration SSIM > 0.91, sub-pixel RMSE < 0.65 px).'
            },
            {
                number: 3,
                title: '3. Classify + Threshold',
                tool: 'CoastSat.PlanetScope · NDWI + Whitewater Mask',
                whatWeAdd: 'Retrained CA beach classifier + ±50 m reference shoreline buffer',
                geoProductTitle: 'Historical Landsat/USGS Baseline (x_ref) & ±50 m Buffer Corridor',
                geoProductExplanation: 'Maps the historical USGS / Landsat mean shoreline (x_ref) and the ±50 m spatial search corridor around the beach face. Pixels outside this corridor or flagged as high-albedo surf-zone foam are masked out.',
                technical: 'Computes NDWI = (Green - NIR)/(Green + NIR) inside the ±50 m x_ref corridor while masking bright breaking-wave whitewater, reducing PlanetScope MHW RMSE from 62.42 m down to 20.07 m.'
            },
            {
                number: 4,
                title: '4. Sub-pixel Waterline',
                tool: 'Marching squares contour · Otsu / Weighted-peaks',
                whatWeAdd: 'Sub-pixel waterline extraction constrained to active foreshore',
                geoProductTitle: 'Instantaneous Sub-Pixel Waterlines (x_raw) at Overpass Tide',
                geoProductExplanation: 'Shows the raw wet/dry boundary (x_raw) extracted at the exact satellite overpass timestamp for both PlanetScope (3 m) and Sentinel-2 (10 m) during high tide (+1.61 m) and low tide (-0.08 m).',
                technical: 'Marching squares iso-value contouring along the thresholded NDWI surface intersects each of the 55 shore-normal USGS transects to record raw cross-shore distance x_raw (m from back-beach origin).'
            },
            {
                number: 5,
                title: '5. Tidal Correction',
                tool: 'FES2022 / NOAA Tide + CoastSat.slope (per-transect)',
                whatWeAdd: 'Per-transect beach-face slope (tan β ≥ 0.020), not one global slope',
                geoProductTitle: 'Horizontal Tidal Shift Vectors (x_raw → x_MHW) & Foreshore Slopes',
                geoProductExplanation: 'Visualizes the cross-shore horizontal correction vector Δx = (z_tide - z_MHW) / tan(β) along each transect that translates the instantaneous waterline to the standard Mean High Water datum (1.344 m NAVD88).',
                technical: 'Applies physically clamped per-transect foreshore slopes (0.020 <= tan_beta <= 0.25) validated against Scripps RTK-GPS beach profiles. Eliminates extreme horizontal blow-ups on flat dissipative bars.'
            },
            {
                number: 6,
                title: '6. Validate vs. Ground Truth',
                tool: 'Scripps RTK-GPS Wheelie + USGS / Landsat / S2',
                whatWeAdd: 'Head-to-head multi-sensor validation & uncertainty budget per transect',
                geoProductTitle: '4-Way Shoreline Overlay: Scripps RTK-GPS vs. PS vs. S2 vs. Landsat',
                geoProductExplanation: 'Simultaneously maps (1) Scripps RTK-GPS ground-truth MHW surveys, (2) PlanetScope 3 m MHW shorelines, (3) Sentinel-2 10 m MHW shorelines, and (4) the Landsat/USGS historical baseline across all transects.',
                technical: 'Evaluated across 7 monthly Scripps RTK-GPS surveys (Oct 2023 – Apr 2024): Sentinel-2 v2 achieves RMSE = 19.08 m (MAE = 14.08 m); PlanetScope v2 achieves RMSE = 20.07 m (MAE = 14.09 m) with 2.4x higher temporal density.'
            },
            {
                number: 7,
                title: '7. Change Rates + QA',
                tool: 'DSAS / Event-Scale Tracking · Visual QA',
                whatWeAdd: 'Event-scale storm retreat & recovery, not just decadal linear rates',
                geoProductTitle: 'El Niño Winter Storm Excursion Choropleth (Transect Change Map)',
                geoProductExplanation: 'Colors each of the 55 USGS transects by its 2023–24 El Niño storm excursion (max minus min MHW width) and compares it directly against the historical Landsat/USGS seasonal excursion (stl_seasonal_excursion_m).',
                technical: 'Captures 8 discrete El Niño erosion/recovery events (threshold >= 15 m median drop), including the Jan 1–8, 2024 peak swell event where 93% of transects retreated simultaneously.'
            },
            {
                number: 8,
                title: '8. Impact Indicators + Dashboard',
                tool: 'Python · Interactive Web Geoportal (OPC)',
                whatWeAdd: 'Rapid coastal hazard dissemination layer for California managers',
                geoProductTitle: 'Critical Coastal Pinch-Point & Infrastructure Vulnerability Hotspots',
                geoProductExplanation: 'Highlights coastal hazard hotspots where winter MHW dry-beach width collapsed below 12 m against back-beach riprap and revetments (south of Oceanside Pier), contrasting with wide accretional zones near the harbor.',
                technical: 'Provides immediate GeoJSON/CSV export of vulnerable transects, storm recovery lags, and sub-monthly shoreline states for California Ocean Protection Council (OPC) Track 1 decision support.'
            }
        ];
    }

    renderSteps() {
        const container = document.getElementById('pipeline-steps');
        if (!container) return;

        let html = '';
        this.steps.forEach(step => {
            const isActive = step.number === this.activeStep ? 'active-step' : '';
            html += `
                <div class="pipeline-step ${isActive}" data-step="${step.number}" id="pipeline-step-${step.number}">
                    <div class="step-header-row">
                        <h4>${step.title}</h4>
                        <span class="step-map-badge">🗺️ View Product</span>
                    </div>
                    <div class="step-tool-line">
                        <span class="tool-tag">${step.tool}</span>
                        <span class="improve-tag">✨ ${step.whatWeAdd}</span>
                    </div>
                    <div class="geo-product-box">
                        <strong>Geographical Product:</strong> ${step.geoProductTitle}
                        <p>${step.geoProductExplanation}</p>
                    </div>
                    <div class="tech-detail" style="display: ${this.currentMode === 'simplified' ? 'none' : 'block'};">
                        <strong>Technical & Validation Detail:</strong> ${step.technical}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Bind click events to each step card
        container.querySelectorAll('.pipeline-step').forEach(card => {
            card.addEventListener('click', () => {
                const stepNum = parseInt(card.getAttribute('data-step'), 10);
                this.setActiveStep(stepNum);
            });
        });
    }

    setActiveStep(stepNumber) {
        this.activeStep = stepNumber;
        document.querySelectorAll('.pipeline-step').forEach(el => {
            const n = parseInt(el.getAttribute('data-step'), 10);
            el.classList.toggle('active-step', n === stepNumber);
        });
        const stepObj = this.steps.find(s => s.number === stepNumber);
        if (this.onStepSelect && stepObj) {
            this.onStepSelect(stepObj);
        }
    }

    getStep(stepNumber) {
        return this.steps.find(s => s.number === stepNumber);
    }

    toggleViewMode() {
        this.currentMode = this.currentMode === 'full' ? 'simplified' : 'full';
        document.querySelectorAll('.pipeline-step .tech-detail').forEach(el => {
            el.style.display = this.currentMode === 'simplified' ? 'none' : 'block';
        });
        return this.currentMode;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PipelineExplainer;
}
