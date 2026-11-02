/**
 * GIST 250 Geoportal - Map Component
 * Handles map initialization, satellite base layers, and vector overlays
 */

class GeoportalMap {
    constructor(center = [33.190, -117.382], zoom = 14) {
        this.center = center;
        this.zoom = zoom;
        this.map = null;
        this.layers = {
            beach: null,
            transects: null,
            cloudMask: null
        };
        this.init();
    }
    
    init() {
        // Initialize Leaflet map
        this.map = L.map('map', {
            center: this.center,
            zoom: this.zoom,
            zoomControl: true
        });
        
        // Base layers
        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        });
        
        const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 18
        });
        
        // Default base layer: Esri World Imagery (Satellite view for coastal analysis)
        esriSatellite.addTo(this.map);
        
        // Layer groups
        this.layers.beach = L.layerGroup().addTo(this.map);
        this.layers.transects = L.layerGroup().addTo(this.map);
        this.layers.cloudMask = L.layerGroup().addTo(this.map);
        
        // Layer Control
        const baseMaps = {
            "Satellite (Esri World Imagery)": esriSatellite,
            "Cartographic (OpenStreetMap)": osm
        };
        
        const overlayMaps = {
            "🏖️ Beach Boundary (Oceanside ROI)": this.layers.beach,
            "📏 Shoreline Transects (USGS)": this.layers.transects,
            "☁️ Cloud / Marine Layer Screening": this.layers.cloudMask
        };
        
        L.control.layers(baseMaps, overlayMaps, { position: 'topright' }).addTo(this.map);
        
        // Scale control
        L.control.scale({ imperial: true, metric: true, position: 'bottomleft' }).addTo(this.map);
    }
    
    setBeachLayer(geojsonData) {
        if (!geojsonData) return;
        this.layers.beach.clearLayers();
        
        const layer = L.geoJSON(geojsonData, {
            style: {
                color: '#005A9C',
                weight: 2.5,
                fillColor: '#0077C4',
                fillOpacity: 0.25,
                dashArray: '4,4'
            },
            onEachFeature: (feature, l) => {
                const props = feature.properties || {};
                const name = props.name || props.beach || 'Oceanside Beach';
                const area = props.area_km2 ? `${Number(props.area_km2).toFixed(2)} km²` : '2.20 km²';
                const nTransects = props.n_transects || 53;
                
                const popup = `
                    <div class="popup-title">🏖️ ${name}</div>
                    <div class="popup-row"><span class="prop-name">Study Area:</span><span class="prop-val">Oceanside, CA</span></div>
                    <div class="popup-row"><span class="prop-name">Area:</span><span class="prop-val">${area}</span></div>
                    <div class="popup-row"><span class="prop-name">Transects:</span><span class="prop-val">${nTransects} fixed USGS lines</span></div>
                    <div class="popup-row"><span class="prop-name">Datum:</span><span class="prop-val">MHW (NAVD88)</span></div>
                `;
                l.bindPopup(popup);
            }
        });
        
        this.layers.beach.addLayer(layer);
        return layer;
    }
    
    setTransectsLayer(geojsonData) {
        if (!geojsonData) return;
        this.layers.transects.clearLayers();
        
        const layer = L.geoJSON(geojsonData, {
            style: feature => {
                const isRetreat = feature.properties?.type === 'retreat';
                return {
                    color: isRetreat ? '#dc3545' : '#28a745',
                    weight: 3,
                    opacity: 0.9,
                    dashArray: isRetreat ? '6,4' : null
                };
            },
            onEachFeature: (feature, l) => {
                const props = feature.properties || {};
                const tId = props.id || props.transect_id || 'USGS Transect';
                const len = props.transect_length_m ? `${props.transect_length_m} m` : '300 m';
                const az = props.azimuth_deg ? `${props.azimuth_deg}°` : '232.8°';
                const status = props.status || (props.qa_origin_ok ? 'Active (USGS QA Passed)' : 'Standard');
                
                const popup = `
                    <div class="popup-title">📏 ${tId}</div>
                    <div class="popup-row"><span class="prop-name">Length:</span><span class="prop-val">${len}</span></div>
                    <div class="popup-row"><span class="prop-name">Azimuth:</span><span class="prop-val">${az}</span></div>
                    <div class="popup-row"><span class="prop-name">Quality:</span><span class="prop-val">${status}</span></div>
                    <div class="popup-row"><span class="prop-name">Target Datum:</span><span class="prop-val">MHW Tidal Intersection</span></div>
                `;
                l.bindPopup(popup);
            }
        });
        
        this.layers.transects.addLayer(layer);
        return layer;
    }
    
    setCloudMaskLayer(geojsonData) {
        if (!geojsonData) return;
        this.layers.cloudMask.clearLayers();
        
        const layer = L.geoJSON(geojsonData, {
            style: {
                color: '#dc3545',
                weight: 1.5,
                fillColor: '#dc3545',
                fillOpacity: 0.15,
                dashArray: '3,3'
            },
            onEachFeature: (feature, l) => {
                const props = feature.properties || {};
                const popup = `
                    <div class="popup-title">☁️ ${props.name || 'Cloud Screening Mask'}</div>
                    <div class="popup-row"><span class="prop-name">Mean Coverage:</span><span class="prop-val">${props.coverage || 18}%</span></div>
                    <div class="popup-row"><span class="prop-name">Screening:</span><span class="prop-val">${props.status || 'UDM2 Filtered'}</span></div>
                `;
                l.bindPopup(popup);
            }
        });
        
        this.layers.cloudMask.addLayer(layer);
        return layer;
    }
    
    fitToBounds(layer) {
        if (layer && typeof layer.getBounds === 'function') {
            const bounds = layer.getBounds();
            if (bounds.isValid()) {
                this.map.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
            }
        }
    }
}

// Global export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeoportalMap;
}
