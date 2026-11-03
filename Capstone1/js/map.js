/**
 * GIST 250 Geoportal - Map & 8-Step Geographical Product Engine
 * Renders step-specific spatial products, multi-sensor shoreline overlays, and interactive transect selection
 */

class GeoportalMap {
    constructor(center = [33.189, -117.381], zoom = 14, onTransectClick = null) {
        this.center = center;
        this.zoom = zoom;
        this.onTransectClick = onTransectClick;
        this.map = null;
        this.baseTransectsLayer = null;
        this.activeProductGroup = null;
        this.selectedTransectHighlight = null;
        this.currentSurveyDate = '2024-02-09';
        this.init();
    }

    init() {
        this.map = L.map('map', {
            center: this.center,
            zoom: this.zoom,
            zoomControl: true
        });

        const esriSatellite = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, USDA, USGS',
                maxZoom: 19
            }
        );

        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        });

        esriSatellite.addTo(this.map);

        this.baseTransectsLayer = L.layerGroup().addTo(this.map);
        this.activeProductGroup = L.layerGroup().addTo(this.map);
        this.selectedTransectHighlight = L.layerGroup().addTo(this.map);

        const baseMaps = {
            'Satellite (Esri World Imagery)': esriSatellite,
            'Cartographic (OpenStreetMap)': osm
        };

        const overlayMaps = {
            '📏 USGS Baseline Transects (55)': this.baseTransectsLayer,
            '🎯 Active Step Geographical Product': this.activeProductGroup
        };

        L.control.layers(baseMaps, overlayMaps, { position: 'topleft' }).addTo(this.map);
        L.control.scale({ imperial: true, metric: true, position: 'bottomleft' }).addTo(this.map);

        // Force Leaflet recalculation after DOM and flex render
        setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 200);
        setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 600);
        window.addEventListener('resize', () => { if (this.map) this.map.invalidateSize(); });
    }

    renderBaseTransects(transectsGeoJSON) {
        if (!transectsGeoJSON) return;
        this.baseTransectsLayer.clearLayers();

        const layer = L.geoJSON(transectsGeoJSON, {
            style: {
                color: 'rgba(255, 255, 255, 0.38)',
                weight: 1.5,
                dashArray: '3,3'
            },
            onEachFeature: (feature, l) => {
                const tid = feature.properties?.transect_id || feature.properties?.id;
                l.on('click', () => {
                    if (this.onTransectClick && tid) this.onTransectClick(tid);
                });
                l.bindTooltip(`Transect ${tid} (Click to inspect RTK & Satellite profile)`, {
                    sticky: true,
                    direction: 'top'
                });
            }
        });

        this.baseTransectsLayer.addLayer(layer);
    }

    highlightTransect(transectId, transectsGeoJSON) {
        this.selectedTransectHighlight.clearLayers();
        if (!transectId || !transectsGeoJSON) return;

        const feat = (transectsGeoJSON.features || []).find(
            f => (f.properties?.transect_id || f.properties?.id) === transectId
        );
        if (!feat) return;

        const hl = L.geoJSON(feat, {
            style: {
                color: '#FFCC00',
                weight: 5,
                opacity: 0.95
            }
        });
        this.selectedTransectHighlight.addLayer(hl);
    }

    activateStepProduct(stepObj, allData, surveyDateFilter = null) {
        if (!stepObj || !allData) return;
        if (surveyDateFilter) this.currentSurveyDate = surveyDateFilter;

        this.activeProductGroup.clearLayers();
        const stepNum = stepObj.number;
        let legendHtml = '';

        if (stepNum === 1) {
            // Step 1: ROI Footprint + UDM2 Cloud Screening Zone
            if (allData.beachPolygons) {
                const roiLayer = L.geoJSON(allData.beachPolygons, {
                    style: {
                        color: '#0077C4',
                        weight: 3,
                        fillColor: '#005A9C',
                        fillOpacity: 0.25
                    },
                    onEachFeature: (f, l) => {
                        l.bindPopup(`
                            <div class="popup-title">🛰️ Step 1: Oceanside Cloud-Clipped ROI</div>
                            <div class="popup-row"><span class="prop-name">Area:</span><span class="prop-val">2.20 km² (55 USGS Transects)</span></div>
                            <div class="popup-row"><span class="prop-name">UDM2 Gate:</span><span class="prop-val">Clear ≥ 85%, Coverage ≥ 90%</span></div>
                            <div class="popup-row"><span class="prop-name">PlanetScope Usable:</span><span class="prop-val">62 scenes (7–12 days/mo)</span></div>
                            <div class="popup-row"><span class="prop-name">Sentinel-2 Usable:</span><span class="prop-val">26 scenes (3–5 days/mo)</span></div>
                            <div class="popup-row"><span class="prop-name">Landsat 8/9 Usable:</span><span class="prop-val">~7 scenes (1–2 days/mo)</span></div>
                        `);
                    }
                });
                this.activeProductGroup.addLayer(roiLayer);
            }
            if (allData.cloudMask) {
                const maskLayer = L.geoJSON(allData.cloudMask, {
                    style: {
                        color: '#dc3545',
                        weight: 2,
                        dashArray: '5,5',
                        fillColor: '#dc3545',
                        fillOpacity: 0.15
                    },
                    onEachFeature: (f, l) => {
                        l.bindPopup(`
                            <div class="popup-title">☁️ Marine Layer Screening Audit Zone</div>
                            <div class="popup-row"><span class="prop-name">Audit Accuracy:</span><span class="prop-val">100% (40/40 scenes)</span></div>
                            <div class="popup-row"><span class="prop-name">True Positives:</span><span class="prop-val">26 usable / 14 rejected</span></div>
                        `);
                    }
                });
                this.activeProductGroup.addLayer(maskLayer);
            }
            legendHtml = `
                <span class="legend-item"><i style="background:#0077C4;border:1px solid #fff"></i> Oceanside ROI Chip (2.20 km²)</span>
                <span class="legend-item"><i style="background:rgba(220,53,69,0.5);border:1px dashed #dc3545"></i> UDM2 Marine Layer Audit Zone</span>
            `;
        } else if (stepNum === 2) {
            // Step 2: AROSICS Local Co-registration Tie-Point Vectors
            if (allData.step2Coreg) {
                const coregLayer = L.geoJSON(allData.step2Coreg, {
                    style: {
                        color: '#FFCC00',
                        weight: 3.5,
                        opacity: 0.95
                    },
                    onEachFeature: (f, l) => {
                        const p = f.properties;
                        const c0 = f.geometry.coordinates[0];
                        const ptMarker = L.circleMarker([c0[1], c0[0]], {
                            radius: 5,
                            fillColor: '#005A9C',
                            color: '#FFCC00',
                            weight: 2,
                            fillOpacity: 1
                        });
                        const popup = `
                            <div class="popup-title">🎯 Step 2: AROSICS Tie-Point ${p.id}</div>
                            <div class="popup-row"><span class="prop-name">Anchor:</span><span class="prop-val">${p.feature_type}</span></div>
                            <div class="popup-row"><span class="prop-name">Local Shift (dx, dy):</span><span class="prop-val">(${p.dx_m} m, ${p.dy_m} m)</span></div>
                            <div class="popup-row"><span class="prop-name">Shift Magnitude:</span><span class="prop-val">${p.shift_m} m (${p.shift_px} px)</span></div>
                            <div class="popup-row"><span class="prop-name">Post-Coreg SSIM:</span><span class="prop-val">${p.ssim_after}</span></div>
                        `;
                        l.bindPopup(popup);
                        ptMarker.bindPopup(popup);
                        this.activeProductGroup.addLayer(ptMarker);
                    }
                });
                this.activeProductGroup.addLayer(coregLayer);
            }
            legendHtml = `
                <span class="legend-item"><i style="background:#005A9C;border:2px solid #FFCC00;border-radius:50%"></i> Back-Beach Tie Point</span>
                <span class="legend-item"><i style="background:#FFCC00;height:3px"></i> Local Shift Vector (25× magnified)</span>
            `;
        } else if (stepNum === 3) {
            // Step 3: CoastSat ±50m Reference Buffer & Landsat/USGS Mean Shoreline (x_ref)
            if (allData.step3RefBuffer) {
                const bufLayer = L.geoJSON(allData.step3RefBuffer, {
                    filter: f => f.properties.layer_type !== 'landsat_usgs_ref_point',
                    style: f => {
                        if (f.properties.layer_type === 'buffer_corridor') {
                            return {
                                color: '#28a745',
                                weight: 1.5,
                                dashArray: '4,4',
                                fillColor: '#28a745',
                                fillOpacity: 0.22
                            };
                        }
                        return {
                            color: '#FFCC00',
                            weight: 3.5,
                            dashArray: '6,4'
                        };
                    },
                    onEachFeature: (f, l) => {
                        const p = f.properties;
                        l.bindPopup(`
                            <div class="popup-title">🛡️ Step 3: ${p.name}</div>
                            <div class="popup-row"><span class="prop-name">Method:</span><span class="prop-val">${p.index || p.sensor}</span></div>
                            <p style="margin:6px 0 0;font-size:0.8rem;color:#4a5568;">${p.description}</p>
                        `);
                    }
                });
                this.activeProductGroup.addLayer(bufLayer);
            }
            legendHtml = `
                <span class="legend-item"><i style="background:rgba(40,167,69,0.35);border:1px dashed #28a745"></i> ±50 m Active Foreshore Corridor</span>
                <span class="legend-item"><i style="background:#FFCC00;height:3px"></i> Historical Landsat/USGS Baseline (x_ref)</span>
            `;
        } else if (stepNum === 4) {
            // Step 4: Instantaneous Sub-Pixel Waterlines (x_raw)
            if (allData.step4RawWaterlines) {
                const rawLayer = L.geoJSON(allData.step4RawWaterlines, {
                    style: f => {
                        const isPS = f.properties.sensor.includes('PlanetScope');
                        const isHighTide = f.properties.z_tide_m > 0.5;
                        return {
                            color: isPS ? (isHighTide ? '#0077C4' : '#38b2ac') : '#f6ad55',
                            weight: isPS ? 3 : 2.5,
                            dashArray: isPS ? null : '5,4'
                        };
                    },
                    pointToLayer: (f, latlng) => {
                        const isPS = f.properties.sensor.includes('PlanetScope');
                        return L.circleMarker(latlng, {
                            radius: 4,
                            fillColor: isPS ? '#0077C4' : '#f6ad55',
                            color: '#fff',
                            weight: 1,
                            fillOpacity: 0.9
                        });
                    },
                    onEachFeature: (f, l) => {
                        const p = f.properties;
                        if (p.transect_id) {
                            l.on('click', () => {
                                if (this.onTransectClick) this.onTransectClick(p.transect_id);
                            });
                        }
                        l.bindPopup(`
                            <div class="popup-title">🌊 Step 4: Raw Sub-Pixel Waterline (x_raw)</div>
                            <div class="popup-row"><span class="prop-name">Sensor:</span><span class="prop-val">${p.sensor}</span></div>
                            <div class="popup-row"><span class="prop-name">Date:</span><span class="prop-val">${p.sat_date}</span></div>
                            ${p.transect_id ? `<div class="popup-row"><span class="prop-name">Transect:</span><span class="prop-val">${p.transect_id}</span></div>` : ''}
                            ${p.x_raw_m !== undefined ? `<div class="popup-row"><span class="prop-name">Raw Waterline (x_raw):</span><span class="prop-val">${p.x_raw_m} m</span></div>` : ''}
                            <div class="popup-row"><span class="prop-name">Overpass Tide (z_tide):</span><span class="prop-val">${p.z_tide_m} m NAVD88</span></div>
                            <div class="popup-row"><span class="prop-name">NDWI Threshold:</span><span class="prop-val">${p.threshold_ndwi}</span></div>
                        `);
                    }
                });
                this.activeProductGroup.addLayer(rawLayer);
            }
            legendHtml = `
                <span class="legend-item"><i style="background:#0077C4;height:3px"></i> PlanetScope x_raw (High Tide +1.61 m)</span>
                <span class="legend-item"><i style="background:#38b2ac;height:3px"></i> PlanetScope x_raw (Low Tide -0.08 m)</span>
                <span class="legend-item"><i style="background:#f6ad55;height:3px"></i> Sentinel-2 x_raw (10 m)</span>
            `;
        } else if (stepNum === 5) {
            // Step 5: Tidal Correction Vectors (x_raw -> x_mhw)
            if (allData.step5TidalCorrection) {
                const tidalLayer = L.geoJSON(allData.step5TidalCorrection, {
                    style: f => {
                        const isHighTide = f.properties.z_tide_m > 1.344;
                        return {
                            color: isHighTide ? '#3182ce' : '#e53e3e',
                            weight: 4,
                            opacity: 0.9
                        };
                    },
                    onEachFeature: (f, l) => {
                        const p = f.properties;
                        const cRaw = f.geometry.coordinates[0];
                        const cMhw = f.geometry.coordinates[1];
                        const mhwDot = L.circleMarker([cMhw[1], cMhw[0]], {
                            radius: 4.5,
                            fillColor: '#28a745',
                            color: '#fff',
                            weight: 1.5,
                            fillOpacity: 1
                        });
                        const popup = `
                            <div class="popup-title">📐 Step 5: Tidal Correction (${p.transect_id})</div>
                            <div class="popup-row"><span class="prop-name">Overpass Date:</span><span class="prop-val">${p.sat_date}</span></div>
                            <div class="popup-row"><span class="prop-name">Overpass Tide (z_tide):</span><span class="prop-val">${p.z_tide_m} m (MHW = 1.344 m)</span></div>
                            <div class="popup-row"><span class="prop-name">Foreshore Slope (tan β):</span><span class="prop-val">${p.tan_beta} ${p.insitu_tan_beta ? `(RTK: ${p.insitu_tan_beta})` : ''}</span></div>
                            <div class="popup-row"><span class="prop-name">Raw Position (x_raw):</span><span class="prop-val">${p.x_raw_m} m</span></div>
                            <div class="popup-row"><span class="prop-name">Tidal Shift (Δx):</span><span class="prop-val">${p.dx_tidal_m > 0 ? '+' : ''}${p.dx_tidal_m} m</span></div>
                            <div class="popup-row"><span class="prop-name">Corrected MHW (x_MHW):</span><span class="prop-val">${p.x_mhw_m} m</span></div>
                        `;
                        l.bindPopup(popup);
                        mhwDot.bindPopup(popup);
                        l.on('click', () => {
                            if (this.onTransectClick) this.onTransectClick(p.transect_id);
                        });
                        this.activeProductGroup.addLayer(mhwDot);
                    }
                });
                this.activeProductGroup.addLayer(tidalLayer);
            }
            legendHtml = `
                <span class="legend-item"><i style="background:#3182ce;height:3px"></i> High-Tide Seaward Shift (+Δx)</span>
                <span class="legend-item"><i style="background:#e53e3e;height:3px"></i> Low-Tide Landward Shift (-Δx)</span>
                <span class="legend-item"><i style="background:#28a745;border-radius:50%"></i> Final MHW Position (1.344 m)</span>
            `;
        } else if (stepNum === 6) {
            // Step 6: 4-Way Validation Overlay (Scripps RTK-GPS vs PlanetScope vs Sentinel-2 vs Landsat/USGS Ref)
            // 1. Add Landsat/USGS Reference Shoreline (x_ref)
            if (allData.step3RefBuffer) {
                const refLine = L.geoJSON(allData.step3RefBuffer, {
                    filter: f => f.properties.layer_type === 'landsat_usgs_ref_line',
                    style: {
                        color: '#cbd5e0',
                        weight: 2.5,
                        dashArray: '6,6',
                        opacity: 0.9
                    }
                });
                this.activeProductGroup.addLayer(refLine);
            }
            // 2. Add RTK-GPS, PlanetScope MHW, and Sentinel-2 MHW for selected survey window
            if (allData.step6RtkValidation) {
                const targetDate = this.currentSurveyDate || '2024-02-09';
                const valLayer = L.geoJSON(allData.step6RtkValidation, {
                    filter: f => {
                        if (targetDate === 'ALL') return true;
                        return f.properties.survey_date === targetDate;
                    },
                    style: f => {
                        const grp = f.properties.layer_group;
                        if (grp === 'rtk_gps_line') return { color: '#FFCC00', weight: 3.5, opacity: 0.95 };
                        if (grp === 'planetscope_mhw_line') return { color: '#0077C4', weight: 3, opacity: 0.95 };
                        if (grp === 'sentinel2_mhw_line') return { color: '#00d2d3', weight: 2.5, dashArray: '5,4', opacity: 0.9 };
                        return { color: '#fff', weight: 2 };
                    },
                    pointToLayer: (f, latlng) => {
                        const grp = f.properties.layer_group;
                        let fill = '#FFCC00';
                        let radius = 5.5;
                        if (grp === 'planetscope_mhw') { fill = '#0077C4'; radius = 4.5; }
                        else if (grp === 'sentinel2_mhw') { fill = '#00d2d3'; radius = 4.5; }
                        return L.circleMarker(latlng, {
                            radius,
                            fillColor: fill,
                            color: '#1a202c',
                            weight: 1.2,
                            fillOpacity: 0.95
                        });
                    },
                    onEachFeature: (f, l) => {
                        const p = f.properties;
                        if (p.transect_id) {
                            l.on('click', () => {
                                if (this.onTransectClick) this.onTransectClick(p.transect_id);
                            });
                        }
                        l.bindPopup(`
                            <div class="popup-title">🎯 ${p.source}</div>
                            <div class="popup-row"><span class="prop-name">Survey Window:</span><span class="prop-val">${p.survey_date}</span></div>
                            ${p.sat_date ? `<div class="popup-row"><span class="prop-name">Satellite Overpass:</span><span class="prop-val">${p.sat_date}</span></div>` : ''}
                            ${p.transect_id ? `<div class="popup-row"><span class="prop-name">Transect:</span><span class="prop-val">${p.transect_id}</span></div>` : ''}
                            ${p.x_mhw_m !== undefined ? `<div class="popup-row"><span class="prop-name">MHW Position:</span><span class="prop-val">${p.x_mhw_m} m</span></div>` : ''}
                            ${p.rtk_mhw_m !== undefined ? `<div class="popup-row"><span class="prop-name">RTK-GPS Truth:</span><span class="prop-val">${p.rtk_mhw_m} m</span></div>` : ''}
                            ${p.residual_mhw_m !== undefined ? `<div class="popup-row"><span class="prop-name">Satellite Error (Res):</span><span class="prop-val">${p.residual_mhw_m > 0 ? '+' : ''}${p.residual_mhw_m} m</span></div>` : ''}
                            ${p.n_points ? `<div class="popup-row"><span class="prop-name">RTK GPS Points:</span><span class="prop-val">${p.n_points} pts (tan β = ${p.slope_tan_beta || 'N/A'})</span></div>` : ''}
                        `);
                    }
                });
                this.activeProductGroup.addLayer(valLayer);
            }
            legendHtml = `
                <span class="legend-item"><i style="background:#FFCC00;border:1px solid #000;border-radius:50%"></i> Scripps RTK-GPS Truth</span>
                <span class="legend-item"><i style="background:#0077C4;border-radius:50%"></i> PlanetScope (3m) MHW</span>
                <span class="legend-item"><i style="background:#00d2d3;border-radius:50%"></i> Sentinel-2 (10m) MHW</span>
                <span class="legend-item"><i style="background:#cbd5e0;height:2px"></i> Landsat/USGS Ref (x_ref)</span>
            `;
        } else if (stepNum === 7) {
            // Step 7: Change Rates & Storm Excursion Choropleth
            if (allData.step7ChangeRates) {
                const changeLayer = L.geoJSON(allData.step7ChangeRates, {
                    style: f => {
                        const exc = f.properties.winter_excursion_m || 0;
                        const color = exc > 35 ? '#dc3545' : (exc > 20 ? '#f6ad55' : '#28a745');
                        return {
                            color,
                            weight: 4,
                            opacity: 0.92
                        };
                    },
                    onEachFeature: (f, l) => {
                        const p = f.properties;
                        l.on('click', () => {
                            if (this.onTransectClick) this.onTransectClick(p.transect_id);
                        });
                        l.bindPopup(`
                            <div class="popup-title">📉 Step 7: El Niño Change (${p.transect_id})</div>
                            <div class="popup-row"><span class="prop-name">Regime:</span><span class="prop-val">${p.regime}</span></div>
                            <div class="popup-row"><span class="prop-name">Winter 23–24 Excursion:</span><span class="prop-val">${p.winter_excursion_m} m</span></div>
                            <div class="popup-row"><span class="prop-name">USGS/Landsat Seasonal:</span><span class="prop-val">${p.usgs_historical_excursion_m || 'N/A'} m</span></div>
                            <div class="popup-row"><span class="prop-name">Min / Max MHW Width:</span><span class="prop-val">${p.min_winter_mhw_m} m / ${p.max_winter_mhw_m} m</span></div>
                            <div class="popup-row"><span class="prop-name">Landsat/USGS Baseline:</span><span class="prop-val">${p.x_ref_m} m</span></div>
                        `);
                    }
                });
                this.activeProductGroup.addLayer(changeLayer);
            }
            legendHtml = `
                <span class="legend-item"><i style="background:#dc3545;height:4px"></i> Severe Storm Excursion (> 35 m)</span>
                <span class="legend-item"><i style="background:#f6ad55;height:4px"></i> Moderate Excursion (20–35 m)</span>
                <span class="legend-item"><i style="background:#28a745;height:4px"></i> Stable / Low Excursion (< 20 m)</span>
            `;
        } else if (stepNum === 8) {
            // Step 8: Critical Pinch-Point & Infrastructure Vulnerability Hotspots
            if (allData.step7ChangeRates) {
                this.activeProductGroup.addLayer(
                    L.geoJSON(allData.step7ChangeRates, {
                        style: { color: 'rgba(255,255,255,0.5)', weight: 2 }
                    })
                );
            }
            if (allData.step8Hotspots) {
                const hotspotLayer = L.geoJSON(allData.step8Hotspots, {
                    pointToLayer: (f, latlng) => {
                        const isCrit = f.properties.risk_level.startsWith('CRITICAL');
                        return L.circleMarker(latlng, {
                            radius: isCrit ? 7 : 5.5,
                            fillColor: isCrit ? '#dc3545' : '#dd6b20',
                            color: '#ffffff',
                            weight: 2,
                            fillOpacity: 0.95
                        });
                    },
                    onEachFeature: (f, l) => {
                        const p = f.properties;
                        l.on('click', () => {
                            if (this.onTransectClick) this.onTransectClick(p.transect_id);
                        });
                        l.bindPopup(`
                            <div class="popup-title">⚠️ Step 8: Coastal Hazard Hotspot (${p.transect_id})</div>
                            <div class="popup-row"><span class="prop-name">Hazard Tier:</span><span class="prop-val">${p.risk_level}</span></div>
                            <div class="popup-row"><span class="prop-name">Min Dry Beach (MHW):</span><span class="prop-val">${p.min_winter_mhw_m} m</span></div>
                            <div class="popup-row"><span class="prop-name">Winter Storm Swing:</span><span class="prop-val">${p.winter_excursion_m} m</span></div>
                            <p style="margin:6px 0 0;font-size:0.8rem;color:#c53030;"><strong>Action:</strong> ${p.recommendation}</p>
                        `);
                    }
                });
                this.activeProductGroup.addLayer(hotspotLayer);
            }
            legendHtml = `
                <span class="legend-item"><i style="background:#dc3545;border:2px solid #fff;border-radius:50%"></i> Critical Pinch-Point (Min MHW < 12 m)</span>
                <span class="legend-item"><i style="background:#dd6b20;border:2px solid #fff;border-radius:50%"></i> High Storm Excursion (> 35 m)</span>
            `;
        }

        // Update floating banner on map
        const bannerTitle = document.getElementById('active-product-title');
        const bannerDesc = document.getElementById('active-product-desc');
        const bannerLegend = document.getElementById('active-product-legend');
        if (bannerTitle) bannerTitle.textContent = `${stepObj.title} — ${stepObj.geoProductTitle}`;
        if (bannerDesc) bannerDesc.textContent = stepObj.geoProductExplanation;
        if (bannerLegend) bannerLegend.innerHTML = legendHtml;
    }

    fitToBounds(geojsonData) {
        if (!geojsonData) return;
        const temp = L.geoJSON(geojsonData);
        const bounds = temp.getBounds();
        if (bounds.isValid()) {
            this.map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeoportalMap;
}
