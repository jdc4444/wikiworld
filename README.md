# NYC 3D Stack Tester

One local app to compare several NYC 3D map stacks side by side with the same camera presets, styling controls, and lightweight runtime metrics.

## Included stacks

- Open sample stack with MapLibre and local NYC building GeoJSON
- Mapbox 3D buildings
- Cesium OSM Buildings
- Google Photorealistic 3D Tiles
- ArcGIS WebScene with OpenStreetMap 3D Buildings

## What this is good for

- Small-scale testing of styling flexibility
- Side-by-side qualitative comparison on the same NYC viewpoints
- Early production evaluation for a higher-traffic network app
- Identifying where vendor stacks limit customization

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and add any provider keys you have:

```bash
cp .env.example .env
```

3. Start the app:

```bash
npm run dev
```

4. Open [http://localhost:4173](http://localhost:4173)

## Provider key notes

- `GOOGLE_MAPS_API_KEY`: required for Google Photorealistic 3D Tiles
- `MAPBOX_ACCESS_TOKEN`: required for Mapbox
- `CESIUM_ION_TOKEN`: recommended for Cesium OSM Buildings
- `ARCGIS_API_KEY`: optional for this public WebScene flow, but useful if you expand ArcGIS layers later

## Architecture

- `server.js`: tiny Express host and public config endpoint
- `public/index.html`: shell app
- `public/app.js`: shared controls, iframe orchestration, comparison grid
- `public/providers/*.html`: provider-native viewers
- `public/providers/common.js`: messaging and metrics helpers

## Notes

- The open sample provider uses local GeoJSON and is the most styling-friendly baseline.
- Google is included as a realism benchmark, but it has much less true restyling freedom than the other stacks.
- Runtime metrics are intentionally lightweight and browser-side. They are useful for comparison, not as definitive performance profiling.

