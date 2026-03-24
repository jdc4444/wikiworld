const path = require("path");
const express = require("express");
const dotenv = require("dotenv");

// Load .env from project root (parent of worktree)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config(); // also load local .env if present

const app = express();
const port = Number(process.env.PORT || 4173);
const publicDir = path.join(__dirname, "public");

const config = {
  generatedAt: new Date().toISOString(),
  appTitle: "NYC 3D Stack Tester",
  env: {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
    mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN || "",
    cesiumIonToken: process.env.CESIUM_ION_TOKEN || "",
    arcgisApiKey: process.env.ARCGIS_API_KEY || "",
    appleMapKitToken: process.env.APPLE_MAPKIT_TOKEN || "",
    lumaSplatUrl: process.env.LUMA_SPLAT_URL || "",
    splatFileUrl: process.env.SPLAT_FILE_URL || "",
  },
  defaultProviders: [
    "open-sample", "maplibre", "deckgl", "mapbox",
    "cesium-osm", "cesium-enhanced", "threejs",
    "google-photorealistic", "arcgis",
    "gaussian-splat",
    "wikipedia",
  ],
  nycPresets: [
    {
      id: "midtown",
      name: "Midtown Core",
      center: { lng: -73.98545, lat: 40.75805 },
      zoom: 15.9,
      pitch: 67,
      bearing: 15,
      altitudeMeters: 750,
      description: "Dense skyline around Bryant Park, Times Square, and Chrysler.",
    },
    {
      id: "downtown",
      name: "Lower Manhattan",
      center: { lng: -74.01135, lat: 40.71295 },
      zoom: 16.15,
      pitch: 70,
      bearing: 23,
      altitudeMeters: 630,
      description: "One World Trade Center cluster and the Financial District.",
    },
    {
      id: "hudson-yards",
      name: "Hudson Yards",
      center: { lng: -74.00255, lat: 40.75415 },
      zoom: 15.7,
      pitch: 69,
      bearing: 40,
      altitudeMeters: 850,
      description: "Tall modern towers with strong west-side depth cues.",
    },
    {
      id: "lic",
      name: "Long Island City",
      center: { lng: -73.94685, lat: 40.74455 },
      zoom: 15.35,
      pitch: 66,
      bearing: 306,
      altitudeMeters: 1000,
      description: "Good for testing residential massing and East River angles.",
    },
  ],
  defaultSettings: {
    presetId: "midtown",
    // Camera
    bearing: 15,
    pitch: 67,
    zoom: 15.9,
    // Colors
    accentColor: "#ff7a18",
    surfaceColor: "#8a8078",
    opacity: 0.92,
    heightScale: 1,
    verticalGradient: true,
    wireframe: false,
    // Lighting
    sun: true,
    lightIntensity: 0.8,
    lightAngle: 210,
    lightAltitude: 30,
    shadowDarkness: 0.15,
    ambientOcclusion: 0.75,
    // Atmosphere
    labels: true,
    fog: true,
    fogDensity: 0.3,
    sky: true,
    skyHueShift: 0,
    skySaturation: 0,
    skyBrightness: 0,
    stars: true,
    // Material (deck.gl / Cesium)
    materialAmbient: 0.28,
    materialDiffuse: 0.72,
    materialShininess: 48,
    // Post-processing
    bloom: false,
    bloomIntensity: 1.0,
    fxaa: true,
    // SSAO (cesium-enhanced + threejs)
    ssao: true,
    ssaoRadius: 8,
    ssaoIntensity: 0.8,
    // Tone mapping (cesium-enhanced)
    tonemapping: true,
    tonemapExposure: 1.6,
    tonemapWarmth: 0.4,
    tonemapContrast: 1.08,
    // Sharpening (cesium-enhanced)
    sharpening: true,
    sharpenAmount: 0.5,
    // ArcGIS weather
    weather: "none",
    edgeSize: 0.6,
    mapStyle: "light",
  },
};

app.get("/api/config", (_req, res) => {
  res.json(config);
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, port });
});

// ─── Atlas Obscura ─────────────────────────────────────────────
const fs = require("fs");
const AO_CACHE_FILE = path.join(__dirname, "data", "atlas-obscura-index.json");
let aoIndex = []; // [{ id, lat, lng }, ...]
let aoShortCache = new Map(); // id → placeShort result

// Load cached index from disk if available
try {
  if (fs.existsSync(AO_CACHE_FILE)) {
    aoIndex = JSON.parse(fs.readFileSync(AO_CACHE_FILE, "utf8"));
    console.log(`Atlas Obscura: loaded ${aoIndex.length} places from cache`);
  }
} catch (e) {
  console.error("Atlas Obscura cache load error:", e.message);
}

// Background: fetch full index if cache is empty or stale (>7 days)
(async () => {
  try {
    const stat = fs.existsSync(AO_CACHE_FILE) ? fs.statSync(AO_CACHE_FILE) : null;
    const stale = !stat || (Date.now() - stat.mtimeMs > 7 * 24 * 60 * 60 * 1000);
    if (stale) {
      const { atlasObscura } = require("atlas-obscura-api");
      console.log("Atlas Obscura: fetching full index...");
      const places = await atlasObscura.placesAll();
      aoIndex = places.filter(p => p.lat && p.lng);
      fs.mkdirSync(path.dirname(AO_CACHE_FILE), { recursive: true });
      fs.writeFileSync(AO_CACHE_FILE, JSON.stringify(aoIndex));
      console.log(`Atlas Obscura: indexed ${aoIndex.length} places`);
    }
  } catch (e) {
    console.error("Atlas Obscura index fetch error:", e.message);
  }
})();

// Bounding box query — returns places within viewport
app.get("/api/atlas/bounds", (req, res) => {
  const { north, south, east, west } = req.query;
  if (!north || !south || !east || !west) {
    return res.status(400).json({ error: "need north,south,east,west" });
  }
  const n = +north, s = +south, e = +east, w = +west;
  const matches = aoIndex.filter(p =>
    p.lat >= s && p.lat <= n && p.lng >= w && p.lng <= e
  );
  // Cap at 500 per request
  res.json(matches.slice(0, 500));
});

// Short detail for a place (title, subtitle, thumbnail, coords)
app.get("/api/atlas/short/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (aoShortCache.has(id)) return res.json(aoShortCache.get(id));
  try {
    const { atlasObscura } = require("atlas-obscura-api");
    const place = await atlasObscura.placeShort(id);
    aoShortCache.set(id, place);
    res.json(place);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Full detail for popup (description, images, tags)
app.get("/api/atlas/full/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const { atlasObscura } = require("atlas-obscura-api");
    const place = await atlasObscura.placeFull(id);
    res.json(place);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Building polygon lookup (Nominatim) ───────────────────
app.get("/api/building-polygon", async (req, res) => {
  const { q, lat, lng } = req.query;
  if (!q) return res.status(400).json({ error: "need q parameter" });

  try {
    // Search Nominatim for the building with polygon geometry
    const params = new URLSearchParams({
      q: q + (lat && lng ? ` ${lat},${lng}` : ""),
      format: "json",
      limit: "1",
      polygon_geojson: "1",
      extratags: "1",
    });
    const url = `https://nominatim.openstreetmap.org/search?${params}`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "WikiWorld/1.0 (building polygon lookup)" },
    });
    const data = await resp.json();

    if (!data.length) return res.json({ found: false });

    const r = data[0];
    const geojson = r.geojson || null;
    const tags = r.extratags || {};

    // Try to get height from OSM tags
    let height = null;
    if (tags.height) height = parseFloat(tags.height);
    else if (tags["building:levels"]) height = parseInt(tags["building:levels"]) * 3.5;

    res.json({
      found: true,
      name: r.display_name?.split(",")[0] || q,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      osmType: r.osm_type,
      osmId: r.osm_id,
      height,
      polygon: geojson?.type === "Polygon" ? geojson.coordinates[0]
        : geojson?.type === "MultiPolygon" ? geojson.coordinates[0][0]
        : null,
      geometryType: geojson?.type || null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use(express.static(publicDir, { extensions: ["html"], setHeaders: (res) => { res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); } }));

app.get("/{*rest}", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, () => {
  console.log(`NYC 3D Stack Tester running at http://localhost:${port}`);
});

