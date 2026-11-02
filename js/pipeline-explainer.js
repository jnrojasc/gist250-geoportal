/**
 * GIST 250 Geoportal - Pipeline Explainer
 * Provides step-by-step explanation of the data processing pipeline
 */

class PipelineExplainer {
    constructor() {
        this.currentMode = 'full'; // 'full' or 'simplified'
        this.steps = [
            {
                number: 1,
                title: 'Step 1: Satellite Data Acquisition',
                description: 'PlanetScope high-resolution (~3 m) satellite imagery is screened and collected for the Oceanside study area during the 2023–24 El Niño winter.',
                technical: 'L1B PlanetScope imagery screened via UDM2 cloud/shadow mask. Sentinel-2 L2A (10 m) baseline runs in parallel for cross-sensor validation.',
                icon: '🛰️'
            },
            {
                number: 2,
                title: 'Step 2: Cloud & Marine Layer Screening',
                description: 'Automated screening rejects cloudy or marine-layer obscured scenes to ensure high-fidelity shoreline extraction.',
                technical: 'Clear sky area fraction threshold >= 0.85 and beach coverage fraction >= 0.90 evaluated across the Oceanside coastal polygon.',
                icon: '☁️'
            },
            {
                number: 3,
                title: 'Step 3: Beach ROI Polygon Clipping',
                description: 'Imagery is clipped directly to official USGS/NOAA coastal benchmark boundaries for Oceanside.',
                technical: 'Vector clipping of PlanetScope ROI chips (53-55 USGS transects, 33.170°N to 33.210°N), reducing footprint from 300 MB scenes to <5 MB chips.',
                icon: '🏖️'
            },
            {
                number: 4,
                title: 'Step 4: MHW Shoreline Position Extraction',
                description: 'Shoreline positions (Mean High Water datum) are computed along fixed shore-normal transects spaced ~50 m apart.',
                technical: 'CoastSat sub-pixel edge detection + equilibrium slope tidal correction to NAVD88 datum, validated against monthly Scripps RTK-GPS surveys.',
                icon: '📏'
            },
            {
                number: 5,
                title: 'Step 5: Retreat & Recovery Event Detection',
                description: 'Displacements across consecutive scenes flag severe erosion episodes (>15 m retreat) and multi-week beach recovery phases.',
                technical: 'Median shoreline cross-shore displacement threshold applied with event tracking: trough date, drop magnitude (m), and percentage of transects retreating.',
                icon: '📈'
            }
        ];
        
        this.renderSteps();
    }
    
    renderSteps() {
        const container = document.getElementById('pipeline-steps');
        if (!container) return;
        
        let html = '';
        this.steps.forEach(step => {
            html += `
                <div class="pipeline-step" data-step="${step.number}">
                    <h4>${step.icon} ${step.title}</h4>
                    <p>${step.description}</p>
                    <div class="tech-detail" style="display: ${this.currentMode === 'simplified' ? 'none' : 'block'};">
                        <strong>Technical detail:</strong> ${step.technical}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    toggleViewMode() {
        this.currentMode = this.currentMode === 'full' ? 'simplified' : 'full';
        const techDetails = document.querySelectorAll('.pipeline-step .tech-detail');
        techDetails.forEach(el => {
            el.style.display = this.currentMode === 'simplified' ? 'none' : 'block';
        });
        return this.currentMode;
    }
}

// Global export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PipelineExplainer;
}
