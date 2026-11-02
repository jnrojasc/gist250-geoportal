# GIST 250 Interactive Geoportal - Coastal Change Monitoring

[![GitHub Pages](https://img.shields.io/badge/Deployment-GitHub%20Pages-blue.svg)](https://JamesColET.github.io/gist250-geoportal/)
[![UCSC Coastal Systems](https://img.shields.io/badge/UCSC-Coastal%20Systems-005A9C.svg)](https://www.ucsc.edu/)
[![Sensors](https://img.shields.io/badge/Sensors-PlanetScope%20%2B%20Sentinel--2-success.svg)](#data-sources)

Interactive web-based visualization platform for coastal change monitoring at **Oceanside, California** during the 2023–2024 El Niño winter. Features high-resolution PlanetScope satellite integration (~3 m), Sentinel-2 baseline cross-validation, automated cloud/marine layer screening, USGS transect-based shoreline tracking, and real-time event metrics.

Live Geoportal: [https://JamesColET.github.io/gist250-geoportal/](https://JamesColET.github.io/gist250-geoportal/)

---

## 🌊 System Architecture & Workflow

```
PlanetScope Imagery (3 m) ──┐
                            ├─► GEE Server Screening (UDM2) ─► GeoJSON / Event Logs ─► GitHub Pages ─► Leaflet Map & Charts
Sentinel-2 Baseline (10 m) ──┘                                                                     │
                                                                                                    ▼
                                                                                           Interactive Exploration
                                                                                           (USGS Transects + MHW)
```

### Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6) | Zero-build, lightweight, instant GitHub Pages serving |
| **Map Engine** | Leaflet.js v1.9.4 | Fast, mobile-responsive, open-source cartography |
| **Charts & Metrics** | Chart.js | Dynamic, reactive line and bar charts |
| **Data Ingestion** | Google Earth Engine (GEE) + Python | Cloud screening and clipping outside client code |
| **Hosting** | GitHub Pages (`JamesColET.github.io`) | Automatic HTTPS, global CDN, no hosting costs |

---

## 📁 Repository Structure

```
gist250-geoportal/
├── index.html                   # Main entry point with responsive map layout
├── css/
│   └── styles.css               # UCSC branded styling (#005A9C, #0077C4, #FFCC00)
├── js/
│   ├── main.js                  # Application initialization and controller
│   ├── map.js                   # Leaflet map instance and layer controls
│   ├── data-fetcher.js          # Asynchronous static GeoJSON / GEE data loader
│   ├── metrics.js               # Chart.js metrics and change event stats
│   └── pipeline-explainer.js    # Multi-step pipeline narrative (simple & technical modes)
├── data/
│   ├── oceanside_roi.geojson    # Official Oceanside beach benchmark boundary (2.20 km²)
│   ├── oceanside_transects.geojson # 55 fixed USGS shore-normal transects
│   ├── oceanside_events.json    # 2023–24 El Niño retreat & recovery event records
│   └── cloud_cover_monthly.json # Monthly PlanetScope cloud screening statistics
├── assets/
│   ├── logo.png                 # UCSC Coastal Systems official branding
│   └── icons/                   # Layer icons (transects, events, markers)
└── README.md                    # Deployment documentation and maintenance guide
```

---

## 🚀 GitHub Pages Deployment Guide

### Step 1: Create GitHub Repository
1. Navigate to [GitHub New Repository](https://github.com/new).
2. Set repository name: `gist250-geoportal`.
3. Set visibility to **Public** (required for standard GitHub Pages).
4. Leave "Initialize with README" unchecked and click **Create repository**.

### Step 2: Push Repository from Local Machine
Open your terminal on Windows or Mac:

```bash
cd "gist250-geoportal"

# Initialize git repository
git init
git branch -M main

# Add files
git add .
git commit -m "feat: initial commit of GIST 250 Oceanside Geoportal"

# Add remote and push to JamesColET
git remote add origin https://github.com/JamesColET/gist250-geoportal.git
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to repository **Settings** → **Pages** (`https://github.com/JamesColET/gist250-geoportal/settings/pages`).
2. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/ (root)`
3. Click **Save**.
4. Within 1–2 minutes, your geoportal will be live at:
   ```
   https://JamesColET.github.io/gist250-geoportal/
   ```

---

## 🔄 Weekly Update Workflow

When new weekly satellite screening or shoreline extractions are generated:

```bash
cd "gist250-geoportal"

# Update data/ files or configs
git add data/
git commit -m "chore(data): weekly update for Oceanside monitoring $(date +'%Y-%m-%d')"
git push origin main
```

GitHub Pages deploys updates automatically within seconds.

---

## 🛡️ Security & Integrity Guardrails

- **Zero API Key Exposure:** Neither Planet API keys nor Google Earth Engine service account tokens are ever bundled or committed in frontend repository files.
- **Consultation Architecture:** Static GeoJSON/JSON data files in `data/` are pre-exported read-only snapshots from the research database, ensuring the core data lake remains untouched.
- **CORS Compliant:** All static assets are served through relative paths compatible with GitHub Pages HTTPS subdomains.

---

## 👤 Author & Academic Context

- **Course:** GIST 250 - Advanced Coastal Remote Sensing & GIS
- **Institution:** University of California, Santa Cruz (UCSC)
- **Maintainer:** James Rojas ([GitHub: @JamesColET](https://github.com/JamesColET))
- **Research Scope:** OPC Track 1 - High-Resolution Satellite Shoreline Monitoring for California Coastal Hazards
