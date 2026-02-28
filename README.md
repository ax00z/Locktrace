# Locktrace

A real-time theft analytics dashboard for the City of Toronto, built on publicly available Toronto Police Service data. The application visualises auto and bicycle theft incidents from the past three months on an interactive map, supported by statistical breakdowns and filterable tables.

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-20-green)
![Python](https://img.shields.io/badge/python-3.12-yellow)

---

## Overview

The system follows a decoupled architecture. A Python scraper pulls incident data from the Toronto Police ArcGIS REST API, cleans it, and writes static JSON files. A React frontend reads those files and renders the dashboard. GitHub Actions ties the two together, running the scraper daily and deploying the updated build to GitHub Pages.

There is no database, no backend server, and no runtime API dependency once the site is deployed.

---

## Prerequisites

- **Node.js** 20 or later
- **Python** 3.12 or later (for the scraper; the frontend runs independently)
- A modern browser (Chromium-based, Firefox, Safari)

---

## Getting Started

### 1. Clone the repository

```
git clone https://github.com/ax00z/loctrace.git
cd locktrace
```

### 2. Scrape data

```
python scrape.py
```

This queries the Toronto Police ArcGIS endpoints, processes the results, and writes two JSON files to `public/data/`:

- `auto_thefts.json`
- `bike_thefts.json`

The script logs progress to stdout, including record counts and any fallback strategies used.

### 3. Install dependencies and start the dev server

```
npm install
npm run dev
```

The app opens at `http://localhost:5173`. It loads the JSON files from `public/data/`. If those files are missing or empty, it falls back to querying the Police API directly from the browser (subject to CORS availability), and finally to a built-in demo dataset.

### 4. Build for production

```
npm run build
```

Output goes to `dist/`. The build inlines all assets into a single HTML file via `vite-plugin-singlefile`.

---

## Project Structure

```
locktrace/
├── .github/
│   └── workflows/
│       └── daily.yml            # Scheduled scrape + deploy
├── public/
│   └── data/                    # Scraper output (JSON)
├── src/
│   ├── components/
│   │   ├── Header.tsx           # Nav bar, filters, theme toggle
│   │   ├── TheftMap.tsx         # Canvas-based map visualisation
│   │   ├── Charts.tsx           # Recharts-based analytics
│   │   ├── StatsCards.tsx       # Summary statistics
│   │   ├── RecentIncidents.tsx  # Paginated incident table
│   │   ├── DetailPanel.tsx      # Single-incident detail modal
│   │   ├── LoadingScreen.tsx
│   │   └── ErrorScreen.tsx
│   ├── services/
│   │   ├── dataService.ts       # Data fetching and parsing
│   │   └── demoData.ts          # Deterministic fallback dataset
│   ├── store/
│   │   └── useStore.ts          # Zustand global state
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── utils/
│   │   └── cn.ts                # Class name merge utility
│   ├── App.tsx                  # Root component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Tailwind imports, scrollbar styles
├── scrape.py                    # Data pipeline script
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Data Pipeline

### Source

Toronto Police Service publishes theft data through ArcGIS REST endpoints:

- **Auto Theft:** `Auto_Theft_Open_Data/FeatureServer/0`
- **Bicycle Theft:** `Bicycle_Thefts_Open_Data/FeatureServer/0`

### Scraper Behaviour

The scraper (`scrape.py`) does the following:

1. Queries each endpoint to discover available fields.
2. Builds a set of WHERE clause strategies (year filter, epoch filter, unfiltered) and tries them in order until one succeeds.
3. Paginates through results in batches of 2,000.
4. Does not request server-side sorting — the ArcGIS API rejects sort requests on these endpoints. Sorting is done in memory after all pages are downloaded.
5. Discards records with missing or invalid coordinates (outside Ontario's bounding box).
6. Discards records older than three months.
7. Writes compact JSON to `public/data/`.

If the scraper fails for one theft type, it writes an empty JSON array so the frontend does not encounter a missing file.

### Automation

The GitHub Actions workflow (`.github/workflows/daily.yml`) runs on a cron schedule at 14:00 UTC daily (09:00 EST). It:

1. Checks out the repository.
2. Runs `scrape.py` with Python 3.12.
3. Verifies the output files exist and contain records.
4. Builds the frontend with `npm ci && npm run build`.
5. Deploys `dist/` to GitHub Pages.

It also runs on push to `main` and can be triggered manually via `workflow_dispatch`.

---

## Frontend

### Tech Stack

| Concern | Library |
|---------|---------|
| Framework | React 19 |
| Bundler | Vite 7 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| State | Zustand |
| Icons | Lucide React |

### Features

- **Interactive map** rendered on an HTML canvas. Supports pan, zoom, and click-to-inspect. Two view modes: scatter (individual dots) and heatmap (density aggregation).
- **Filter controls** for theft type (all, auto, bike) in the header.
- **Theme toggle** with automatic detection of the operating system's light/dark preference. The toggle in the header overrides the system setting.
- **Statistical cards** showing total counts, peak hour, daily average, and the highest-incidence neighbourhood.
- **Charts** for hourly distribution, monthly trend (last three calendar months), top neighbourhoods, and premise type breakdown.
- **Paginated incident table** sorted by date, with click-to-open detail modals.
- **Live API test** panel in the sidebar for verifying direct API connectivity.

### Data Loading Strategy

1. Attempt to fetch `auto_thefts.json` and `bike_thefts.json` from the static `/data/` path.
2. If static files are missing or empty, fall back to querying the live ArcGIS API from the browser.
3. If both fail, load a deterministic demo dataset generated with a seeded PRNG.

---

## Configuration

| Variable | Location | Default | Purpose |
|----------|----------|---------|---------|
| `TIME_WINDOW_MONTHS` | `scrape.py` | `3` | How many months of data to keep |
| `PAGE_SIZE` | `scrape.py` | `2000` | Records per API page |
| `MAX_RETRIES` | `scrape.py` | `3` | Retry count per request |
| `RETRY_DELAY` | `scrape.py` | `5` | Seconds between retries |

The frontend computes its own three-month cutoff independently, so both sides stay in sync without shared configuration.

---

## Troubleshooting

**The map is blank or the page is white.**
Check the browser console. If the data loaded but nothing renders, the canvas element may not have received dimensions. Resize the browser window or check that the parent container has a defined height.

**The scraper returns zero records.**
The ArcGIS API may be temporarily down. Check `https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/Auto_Theft_Open_Data/FeatureServer/0/query?where=1=1&returnCountOnly=true&f=json` in a browser. If it returns a count, the API is up and the issue is likely in the WHERE clause. The scraper logs which strategy it attempts and whether it succeeds.

**Data looks stale.**
Run `python scrape.py` to refresh it. If you are using GitHub Pages, check the Actions tab to confirm the daily workflow ran successfully.

**CORS errors when testing live API from the browser.**
The ArcGIS endpoints do not always allow browser-origin requests. This is expected. The live fallback works in some environments but not all. The primary data path is through the pre-scraped static files.

---

## License

MIT
