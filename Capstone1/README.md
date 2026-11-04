# Capstone 1 — Local Native 2D CoastSat & CoastSat.PlanetScope Geoportal

[![GitHub Pages](https://img.shields.io/badge/Deployment-GitHub%20Pages-blue.svg)](https://jnrojasc.github.io/gist250-geoportal/Capstone1/)
[![UCSC Coastal Systems](https://img.shields.io/badge/UCSC-Coastal%20Systems-005A9C.svg)](https://www.ucsc.edu/)
[![Sensors](https://img.shields.io/badge/Sensors-PlanetScope%203m%20%2B%20Sentinel--2%2010m-success.svg)](#data-sources)

Interactive web-based visualization platform for coastal change monitoring at **Oceanside, California** during the 2023–2024 El Niño winter. Features high-resolution PlanetScope SuperDove satellite integration (~3 m), Sentinel-2 baseline cross-validation, the unmodified ("As-Is") Local Native 2D `CoastSat` & `CoastSat.PlanetScope` sub-pixel extraction engine, local AROSICS sub-pixel co-registration, CDIP wave runup adjustments, and in-situ validation against Scripps RTK-GPS ground truth.

Live Geoportal: [https://jnrojasc.github.io/gist250-geoportal/Capstone1/](https://jnrojasc.github.io/gist250-geoportal/Capstone1/)

---

## 🌊 System Architecture & Workflow

```
PlanetScope SuperDove (3 m) ──┐
                              ├─► Local Python GDAL / AROSICS ─► Local Native 2D CoastSat ─► GeoJSON / Parquet ─► GitHub Pages ─► Leaflet Map & Charts
Sentinel-2 Baseline (10 m)  ──┘     (Sub-pixel Coregistration)      (Marching Squares 2D)                                    │
                                                                                                                              ▼
                                                                                                                     Interactive Exploration
                                                                                                                     (55 USGS Transects + RTK Truth)
```

### Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6) | Zero-build, lightweight, instant GitHub Pages serving |
| **Map Engine** | Leaflet.js v1.9.4 | Fast, mobile-responsive, open-source cartography |
| **Charts & Metrics** | Chart.js | Dynamic, reactive line and bar charts |
| **Extraction Engine** | Local Native Python (`CoastSat` / `CoastSat.PlanetScope` + GDAL) | Local unmodified 2D sub-pixel extraction, Marching Squares MNDWI contouring |
| **Co-Registration** | Local AROSICS (`phase_cross_correlation`) | Sub-pixel back-beach urban anchor coregistration |
| **Hosting** | GitHub Pages (`jnrojasc.github.io/gist250-geoportal/Capstone1/`) | Automatic HTTPS, global CDN, no hosting costs |

---

## 📁 Repository Structure

```
Capstone1/
├── index.html                   # Main entry point with responsive map layout and 8-step pipeline
├── css/
│   └── styles.css               # UCSC branded styling (#005A9C, #0077C4, #FFCC00)
├── js/
│   ├── main.js                  # Application initialization and controller
│   ├── map.js                   # Leaflet map instance and layer controls
│   ├── data-fetcher.js          # Asynchronous static GeoJSON / JSON data loader
│   ├── metrics.js               # Chart.js metrics, ablation analysis, and survey benchmarks
│   └── pipeline-explainer.js    # Multi-step pipeline narrative (simple & technical modes)
├── data/
│   ├── oceanside_roi.geojson    # Official Oceanside beach benchmark boundary (2.20 km²)
│   ├── oceanside_transects.geojson # 55 fixed USGS shore-normal transects
│   ├── step1_reference_shoreline.geojson
│   ├── step2_coreg_vectors.geojson
│   ├── step3_satellite_shorelines.geojson # Native 2D CoastSat extracted shorelines
│   ├── step4_tidal_corrected.geojson
│   ├── step5_transect_intersections.geojson
│   ├── step6_validation_metrics.json    # Accuracy benchmarks vs Scripps RTK-GPS
│   └── step7_dsas_rates.geojson
├── assets/
│   ├── figures/                 # QA summary and calibration charts
│   ├── logo.png                 # UCSC Coastal Systems official branding
│   └── icons/                   # Layer icons (transects, events, markers)
└── README.md                    # Deployment documentation and maintenance guide
```

---

## 🚀 GitHub Pages Deployment Guide

### Deployment via Parent Repository
`Capstone1` is served directly on GitHub Pages under the `gist250-geoportal` root:

```bash
# Push updates from local repository
git add Capstone1/
git commit -m "feat(capstone1): update local native 2D CoastSat geoportal"
git push origin main
```

Live deployment URL:
```
https://jnrojasc.github.io/gist250-geoportal/Capstone1/
```

---

## 🛡️ Security & Integrity Guardrails

- **Zero API Key Exposure:** No proprietary API keys, service tokens, or private credentials are bundled or committed in frontend repository files.
- **Consultation Architecture:** Static GeoJSON/JSON data files in `data/` are pre-exported read-only snapshots from analytical models, ensuring reproducibility without direct database exposure.
- **CORS Compliant:** All static assets are served through relative paths compatible with GitHub Pages HTTPS subdomains.

---

## 👤 Author & Academic Context

- **Course:** GIST 250 - Advanced Coastal Remote Sensing & GIS
- **Institution:** University of California, Santa Cruz (UCSC)
- **Maintainer:** James Rojas ([GitHub: @jnrojasc](https://github.com/jnrojasc))
- **Research Scope:** OPC Track 1 - High-Resolution Satellite Shoreline Monitoring for California Coastal Hazards
