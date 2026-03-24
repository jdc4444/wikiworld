const providerCatalog = [
  {
    id: "open-sample",
    name: "Open Sample",
    eyebrow: "Self-hosted path",
    summary: "MapLibre plus local NYC GeoJSON. This is the most flexible baseline for styling experiments.",
    tags: ["Open data", "High styling freedom", "No key required"],
    framePath: "/providers/open-sample.html",
    metricHint: "Best proxy for a self-hosted 3D extrusion stack.",
  },
  {
    id: "mapbox",
    name: "Mapbox 3D",
    eyebrow: "Hosted vector stack",
    summary: "Strong web performance and decent visual polish, with practical but provider-shaped styling controls.",
    tags: ["Hosted", "Vector + extrusion", "Token required"],
    framePath: "/providers/mapbox.html",
    metricHint: "Good signal for consumer web map behavior under load.",
  },
  {
    id: "cesium-osm",
    name: "Cesium OSM Buildings",
    eyebrow: "Open 3D Tiles",
    summary: "Global open 3D buildings in a native 3D Tiles flow. Useful for large-scene and engine-adjacent testing.",
    tags: ["3D Tiles", "Global buildings", "Token recommended"],
    framePath: "/providers/cesium-osm.html",
    metricHint: "Strong indicator for open 3D Tiles runtime behavior.",
  },
  {
    id: "cesium-enhanced",
    name: "Cesium Enhanced",
    eyebrow: "Post-processed 3D Tiles",
    summary: "Cesium OSM Buildings with custom GLSL SSAO, ACES tone mapping, and CAS sharpening. The rendering pipeline fix for ArcGIS-level visuals.",
    tags: ["3D Tiles", "SSAO", "Tone mapping", "Token recommended"],
    framePath: "/providers/cesium-enhanced.html",
    metricHint: "Compare directly to Cesium OSM and ArcGIS to see what post-processing adds.",
  },
  {
    id: "threejs",
    name: "Three.js",
    eyebrow: "Full 3D engine",
    summary: "Same NYC GeoJSON rendered in Three.js with PBR materials, SSAOPass, bloom, and PCF soft shadows via EffectComposer.",
    tags: ["PBR", "SSAO", "EffectComposer", "No key required"],
    framePath: "/providers/threejs.html",
    metricHint: "Shows what the same data looks like in a general-purpose 3D engine.",
  },
  {
    id: "google-photorealistic",
    name: "Google Photorealistic",
    eyebrow: "Realism benchmark",
    summary: "Photoreal city mesh and the highest realism ceiling here, but much less true restyling freedom.",
    tags: ["Photoreal mesh", "3D Tiles", "API key required"],
    framePath: "/providers/google-photorealistic.html",
    metricHint: "Use this as the realism ceiling, not the styling baseline.",
  },
{
    id: "deckgl",
    name: "deck.gl",
    eyebrow: "WebGL overlay stack",
    summary: "GeoJSON polygon extrusion over a MapLibre basemap using deck.gl's overlay renderer. Full shader and material control.",
    tags: ["Overlay", "GeoJSON extrusion", "No key required"],
    framePath: "/providers/deckgl.html",
    metricHint: "Shows deck.gl's overlay rendering model with MapLibre underneath.",
  },
  {
    id: "maplibre",
    name: "MapLibre GL JS",
    eyebrow: "Open-source vector tiles",
    summary: "Open-source Mapbox fork with native fill-extrusion from OpenFreeMap vector tiles. No API key needed.",
    tags: ["Open source", "Vector tiles", "No key required"],
    framePath: "/providers/maplibre.html",
    metricHint: "Direct comparison to Mapbox without vendor lock-in.",
  },
{
    id: "arcgis",
    name: "ArcGIS WebScene",
    eyebrow: "GIS-native scene",
    summary: "Public ArcGIS WebScene with OpenStreetMap 3D Buildings, useful for GIS-heavy workflows and layer filtering.",
    tags: ["WebScene", "GIS stack", "Public scene"],
    framePath: "/providers/arcgis.html",
    metricHint: "Shows what an ArcGIS-centric workflow feels like without custom preprocessing.",
  },
  {
    id: "gaussian-splat",
    name: "Gaussian Splatting",
    eyebrow: "Emerging / NeRF",
    summary: "Photorealistic scene-scale capture via 3D Gaussian Splatting. Not yet city-scale but the highest per-scene realism available.",
    tags: ["Photorealistic", "Scene-scale", "Emerging"],
    framePath: "/providers/gaussian-splat.html",
    metricHint: "Independent camera. Shows the photorealism ceiling for captured scenes.",
  },
  {
    id: "wikipedia",
    name: "WikiWorld",
    eyebrow: "Wikipedia geosearch",
    summary: "Every geotagged Wikipedia article pinned on the map. Search any topic or place and explore articles spatially.",
    tags: ["Wikipedia", "Geosearch", "No key required"],
    framePath: "/providers/wikipedia.html",
    metricHint: "Shows Wikipedia's geolocation coverage for any area on the planet.",
  },
];

const PROVIDER_CYCLE_ORDER = [
  "mapbox", "maplibre", "cesium-osm", "cesium-enhanced", "threejs", "arcgis",
  "open-sample", "deckgl", "google-photorealistic", "gaussian-splat", "wikipedia",
];

const MAP_STYLES = ["light", "dark", "streets", "satellite"];

function getOrderedActiveProviders() {
  return PROVIDER_CYCLE_ORDER.filter((id) => state.activeProviders.has(id));
}

const state = {
  config: null,
  settings: null,
  customCenter: null, // { lng, lat, name } when using city search
  activeProviders: new Set(),
  providerFrames: new Map(),
  providerStatus: new Map(),
  providerMetrics: new Map(),
  lastSyncAt: null,
};

const elements = {
  presetSelect: document.getElementById("preset-select"),
  accentColor: document.getElementById("accent-color"),
  surfaceColor: document.getElementById("surface-color"),
  opacityRange: document.getElementById("opacity-range"),
  heightScaleRange: document.getElementById("height-scale-range"),
  bearingRange: document.getElementById("bearing-range"),
  pitchRange: document.getElementById("pitch-range"),
  zoomRange: document.getElementById("zoom-range"),
  labelsToggle: document.getElementById("labels-toggle"),
  sunToggle: document.getElementById("sun-toggle"),
  opacityValue: document.getElementById("opacity-value"),
  heightScaleValue: document.getElementById("height-scale-value"),
  bearingValue: document.getElementById("bearing-value"),
  pitchValue: document.getElementById("pitch-value"),
  zoomValue: document.getElementById("zoom-value"),
  providerList: document.getElementById("provider-list"),
  metricsShelf: document.getElementById("metrics-shelf"),
  comparisonGrid: document.getElementById("comparison-grid"),
  activePresetName: document.getElementById("active-preset-name"),
  activePresetDescription: document.getElementById("active-preset-description"),
  providerCardTemplate: document.getElementById("provider-card-template"),
  metricCardTemplate: document.getElementById("metric-card-template"),
  syncButton: document.getElementById("sync-button"),
  reloadButton: document.getElementById("reload-button"),
  keyMapbox: document.getElementById("key-mapbox"),
  keyGoogle: document.getElementById("key-google"),
  keyCesium: document.getElementById("key-cesium"),
  keyArcgis: document.getElementById("key-arcgis"),
  keyApple: document.getElementById("key-apple"),
  keyLuma: document.getElementById("key-luma"),
  applyKeysButton: document.getElementById("apply-keys-button"),
  citySearch: document.getElementById("city-search"),
  citySearchButton: document.getElementById("city-search-button"),
  mapStyleButton: document.getElementById("map-style-button"),
  mapStyleLabel: document.getElementById("map-style-label"),
};

bootstrap().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<pre style="padding:24px;color:white;">Failed to boot app.\n${error?.stack || error}</pre>`;
});

async function bootstrap() {
  state.config = await fetch("/api/config").then((response) => response.json());
  state.settings = { ...state.config.defaultSettings };

  // Overlay browser-stored keys on top of server-provided ones
  hydrateApiKeys();

  const storedProviders = localStorage.getItem("nyc3d_activeProviders");
  if (storedProviders) {
    JSON.parse(storedProviders).forEach((id) => state.activeProviders.add(id));
  } else {
    state.config.defaultProviders.forEach((id) => state.activeProviders.add(id));
  }

  // Restore persisted color choices
  const storedAccent = localStorage.getItem("nyc3d_accentColor");
  const storedSurface = localStorage.getItem("nyc3d_surfaceColor");
  if (storedAccent) state.settings.accentColor = storedAccent;
  if (storedSurface) state.settings.surfaceColor = storedSurface;

  hydratePresetSelect();
  hydrateProviderToggles();
  hydrateControls();
  renderMetricsShelf();
  renderComparisonGrid();
  updatePresetMeta();
  broadcastSettings();

  window.addEventListener("message", handleProviderMessage);
  elements.syncButton.addEventListener("click", () => broadcastSettings());
  elements.reloadButton.addEventListener("click", () => reloadActiveProviders());
  if (elements.applyKeysButton) elements.applyKeysButton.addEventListener("click", () => saveApiKeysAndReload());
  elements.citySearchButton.addEventListener("click", () => searchCity());
  elements.citySearch.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchCity();
  });

  // Map style button
  elements.mapStyleButton.addEventListener("click", () => {
    const idx = MAP_STYLES.indexOf(state.settings.mapStyle);
    state.settings.mapStyle = MAP_STYLES[(idx + 1) % MAP_STYLES.length];
    elements.mapStyleLabel.textContent = state.settings.mapStyle;
    broadcastSettings();
  });

  initKeyboardHUD();

  // Default to fullscreen mode showing first provider in cycle order
  const ordered = getOrderedActiveProviders();
  if (ordered.length > 0) {
    expandProvider(ordered[0]);
  }
}

function hydratePresetSelect() {
  const options = state.config.nycPresets
    .map((preset) => `<option value="${preset.id}">${preset.name}</option>`)
    .join("");
  elements.presetSelect.innerHTML = options;
  elements.presetSelect.value = state.settings.presetId;
}

function hydrateProviderToggles() {
  elements.providerList.innerHTML = "";

  for (const provider of providerCatalog) {
    const wrapper = document.createElement("label");
    wrapper.className = "provider-toggle";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = state.activeProviders.has(provider.id);
    input.dataset.providerId = provider.id;
    input.addEventListener("change", (event) => {
      if (event.target.checked) {
        state.activeProviders.add(provider.id);
      } else {
        state.activeProviders.delete(provider.id);
        state.providerFrames.delete(provider.id);
      }

      localStorage.setItem("nyc3d_activeProviders", JSON.stringify([...state.activeProviders]));
      renderMetricsShelf();
      renderComparisonGrid();
      broadcastSettings();
    });

    const meta = document.createElement("div");
    meta.className = "provider-toggle__meta";
    meta.innerHTML = `
      <div class="provider-toggle__title">
        <strong>${provider.name}</strong>
        <span class="provider-toggle__badge">${provider.eyebrow}</span>
      </div>
      <p>${provider.summary}</p>
    `;

    wrapper.append(input, meta);
    elements.providerList.append(wrapper);
  }
}

function hydrateControls() {
  const boundInputs = [
    ["accentColor", elements.accentColor, "input"],
    ["surfaceColor", elements.surfaceColor, "input"],
    ["opacity", elements.opacityRange, "input"],
    ["heightScale", elements.heightScaleRange, "input"],
    ["bearing", elements.bearingRange, "input"],
    ["pitch", elements.pitchRange, "input"],
    ["zoom", elements.zoomRange, "input"],
    ["labels", elements.labelsToggle, "change"],
    ["sun", elements.sunToggle, "change"],
  ];

  syncControlValues();

  elements.presetSelect.addEventListener("change", () => {
    applyPreset(elements.presetSelect.value);
  });

  for (const [key, element, eventName] of boundInputs) {
    element.addEventListener(eventName, () => {
      state.settings[key] =
        element.type === "checkbox"
          ? element.checked
          : element.type === "range"
            ? Number(element.value)
            : element.value;
      syncControlValues();
      broadcastSettings();
      // Persist color choices
      if (key === "accentColor") localStorage.setItem("nyc3d_accentColor", state.settings.accentColor);
      if (key === "surfaceColor") localStorage.setItem("nyc3d_surfaceColor", state.settings.surfaceColor);
    });
  }
}

function syncControlValues() {
  elements.accentColor.value = state.settings.accentColor;
  elements.surfaceColor.value = state.settings.surfaceColor;
  elements.opacityRange.value = state.settings.opacity;
  elements.heightScaleRange.value = state.settings.heightScale;
  elements.bearingRange.value = state.settings.bearing;
  elements.pitchRange.value = state.settings.pitch;
  elements.zoomRange.value = state.settings.zoom;
  elements.labelsToggle.checked = state.settings.labels;
  elements.sunToggle.checked = state.settings.sun;
  elements.opacityValue.textContent = Number(state.settings.opacity).toFixed(2);
  elements.heightScaleValue.textContent = `${Number(state.settings.heightScale).toFixed(2)}x`;
  elements.bearingValue.textContent = `${Math.round(state.settings.bearing)}°`;
  elements.pitchValue.textContent = `${Math.round(state.settings.pitch)}°`;
  elements.zoomValue.textContent = Number(state.settings.zoom).toFixed(1);
}

function applyPreset(presetId) {
  const preset = state.config.nycPresets.find((item) => item.id === presetId);
  if (!preset) {
    return;
  }

  state.customCenter = null; // Clear city search
  elements.citySearch.value = "";

  state.settings = {
    ...state.settings,
    presetId: preset.id,
    bearing: preset.bearing,
    pitch: preset.pitch,
    zoom: preset.zoom,
  };

  syncControlValues();
  updatePresetMeta();
  broadcastSettings();
}

function updatePresetMeta() {
  const preset = getActivePreset();
  if (!preset) {
    return;
  }

  elements.activePresetName.textContent = preset.name;
  elements.activePresetDescription.textContent = preset.description;
  elements.presetSelect.value = preset.id;
}

function renderComparisonGrid() {
  elements.comparisonGrid.innerHTML = "";

  // Render in cycle order so the default expanded provider is first in DOM
  const orderedIds = PROVIDER_CYCLE_ORDER.filter((id) => state.activeProviders.has(id));
  const remainingIds = [...state.activeProviders].filter((id) => !orderedIds.includes(id));
  const activeProviders = [...orderedIds, ...remainingIds]
    .map((id) => providerCatalog.find((p) => p.id === id))
    .filter(Boolean);
  if (!activeProviders.length) {
    elements.comparisonGrid.innerHTML =
      '<article class="surface" style="padding:24px;">Choose at least one provider to render the comparison grid.</article>';
    return;
  }

  // Build all cards — stagger loading: first immediately, rest queued
  state._loadQueue = [];

  for (let i = 0; i < activeProviders.length; i++) {
    const provider = activeProviders[i];
    const card = elements.providerCardTemplate.content.firstElementChild.cloneNode(true);
    card.dataset.providerId = provider.id;

    card.querySelector(".provider-card__eyebrow").textContent = provider.eyebrow;
    card.querySelector(".provider-card__title").textContent = provider.name;
    card.querySelector(".provider-card__summary").textContent = provider.summary;

    const tags = card.querySelector(".provider-card__tags");
    provider.tags.forEach((tag) => {
      const pill = document.createElement("span");
      pill.className = "tag";
      pill.textContent = tag;
      tags.append(pill);
    });

    const frame = card.querySelector(".provider-frame");
    const frameParams = new URLSearchParams({ provider: provider.id });
    for (const [envKey, value] of Object.entries(state.config.env)) {
      if (value) {
        frameParams.set(envKey, value);
      }
    }
    const frameSrc = `${provider.framePath}?${frameParams.toString()}`;
    frame.title = provider.name;
    state.providerFrames.set(provider.id, frame);

    if (i === 0) {
      frame.src = frameSrc;
    } else {
      frame.dataset.pendingSrc = frameSrc;
      state._loadQueue.push(provider.id);
    }

    // Click header to expand/collapse provider to fill workspace
    card.querySelector(".provider-card__head").addEventListener("click", () => {
      toggleExpandProvider(provider.id);
    });
    card.querySelector(".provider-card__head").style.cursor = "pointer";

    elements.comparisonGrid.append(card);
    paintProviderStatus(provider.id);
  }
}

function expandProvider(providerId) {
  const grid = elements.comparisonGrid;
  grid.dataset.expanded = providerId;
  grid.classList.add("comparison-grid--expanded");
  for (const card of grid.querySelectorAll(".provider-card")) {
    if (card.dataset.providerId === providerId) {
      card.classList.add("provider-card--expanded");
      card.classList.remove("provider-card--background");
    } else {
      card.classList.remove("provider-card--expanded");
      card.classList.add("provider-card--background");
    }
  }
  const statusStrip = document.querySelector(".status-strip");
  if (statusStrip) statusStrip.style.display = "none";
  elements.metricsShelf.style.display = "none";
  document.querySelector(".workspace").scrollTop = 0;

  // (nav arrows removed — use arrow keys to navigate, key 5 for map style)
}

function collapseExpanded() {
  const grid = elements.comparisonGrid;
  delete grid.dataset.expanded;
  grid.classList.remove("comparison-grid--expanded");
  for (const card of grid.querySelectorAll(".provider-card")) {
    card.classList.remove("provider-card--expanded");
    card.classList.remove("provider-card--background");
  }
  const statusStrip = document.querySelector(".status-strip");
  if (statusStrip) statusStrip.style.display = "";
  elements.metricsShelf.style.display = "";
  // (nav arrows removed)
}

function toggleExpandProvider(providerId) {
  const grid = elements.comparisonGrid;
  if (grid.dataset.expanded === providerId) {
    collapseExpanded();
  } else {
    expandProvider(providerId);
  }
}

function navigateExpandedProvider(direction) {
  const ordered = getOrderedActiveProviders();
  if (ordered.length === 0) return;
  const current = elements.comparisonGrid.dataset.expanded;
  const idx = ordered.indexOf(current);
  const next = (idx + direction + ordered.length) % ordered.length;
  expandProvider(ordered[next]);
}


// ESC to collapse expanded provider
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && elements.comparisonGrid.dataset.expanded) {
    collapseExpanded();
  }
});

function loadNextQueuedProvider() {
  if (!state._loadQueue || state._loadQueue.length === 0) return;
  const nextId = state._loadQueue.shift();
  const frame = state.providerFrames.get(nextId);
  if (frame && frame.dataset.pendingSrc) {
    frame.src = frame.dataset.pendingSrc;
    delete frame.dataset.pendingSrc;
  }
}

function renderMetricsShelf() {
  elements.metricsShelf.innerHTML = "";

  const activeProviders = providerCatalog.filter((provider) => state.activeProviders.has(provider.id));
  for (const provider of activeProviders) {
    const metricCard = elements.metricCardTemplate.content.firstElementChild.cloneNode(true);
    metricCard.dataset.providerId = provider.id;
    metricCard.querySelector(".metric-card__eyebrow").textContent = provider.eyebrow;
    metricCard.querySelector(".metric-card__title").textContent = provider.name;
    elements.metricsShelf.append(metricCard);
    paintMetricCard(provider.id);
  }
}

function broadcastSettings() {
  const preset = getActivePreset();
  const center = state.customCenter || (preset && preset.center);
  if (!center) {
    return;
  }

  state.lastSyncAt = Date.now();
  const payload = {
    ...state.settings,
    center,
    altitudeMeters: preset ? preset.altitudeMeters : undefined,
  };

  for (const [providerId, frame] of state.providerFrames.entries()) {
    if (!state.activeProviders.has(providerId) || !frame.contentWindow) {
      continue;
    }

    frame.contentWindow.postMessage(
      {
        source: "nyc-3d-stack-tester-shell",
        providerId,
        type: "apply-settings",
        payload,
      },
      window.location.origin,
    );
  }
}

function reloadActiveProviders() {
  for (const [providerId, frame] of state.providerFrames.entries()) {
    if (!state.activeProviders.has(providerId)) {
      continue;
    }

    state.providerStatus.delete(providerId);
    state.providerMetrics.delete(providerId);
    if (frame.contentWindow) {
      frame.contentWindow.postMessage(
        {
          source: "nyc-3d-stack-tester-shell",
          providerId,
          type: "reload-provider",
        },
        window.location.origin,
      );
    }
  }

  renderMetricsShelf();
  renderComparisonGrid();
}

function handleProviderMessage(event) {
  if (event.origin !== window.location.origin) {
    return;
  }

  const { data } = event;
  if (!data || data.source !== "nyc-3d-stack-tester-provider") {
    return;
  }

  const { providerId, type, payload } = data;
  if (!providerId) {
    return;
  }

  if (type === "ready") {
    state.providerStatus.set(providerId, {
      status: "ready",
      detail: payload?.detail || "",
      capabilities: payload?.capabilities || [],
    });
    paintProviderStatus(providerId);
    // Push current settings (including persisted colors) to the newly ready provider
    broadcastSettings();
    // Load next queued provider
    loadNextQueuedProvider();
    return;
  }

  if (type === "status") {
    state.providerStatus.set(providerId, {
      status: payload?.status || "booting",
      detail: payload?.detail || "",
      capabilities: payload?.capabilities || [],
    });
    paintProviderStatus(providerId);
    return;
  }

  if (type === "keydown") {
    // ESC from iframe to collapse expanded provider
    if (payload.key === "Escape" && elements.comparisonGrid.dataset.expanded) {
      collapseExpanded();
      return;
    }
    // Arrow keys to navigate between providers in fullscreen
    if ((payload.key === "ArrowLeft" || payload.key === "ArrowRight") && elements.comparisonGrid.dataset.expanded) {
      navigateExpandedProvider(payload.key === "ArrowLeft" ? -1 : 1);
      return;
    }
    // Forward keyboard events from iframes (fullscreen mode)
    handleKeyBinding(payload);
    return;
  }

  if (type === "metrics") {
    state.providerMetrics.set(providerId, payload || {});
    paintMetricCard(providerId);
  }
}

function paintProviderStatus(providerId) {
  const card = elements.comparisonGrid.querySelector(`[data-provider-id="${providerId}"]`);
  if (!card) {
    return;
  }

  const status = state.providerStatus.get(providerId) || { status: "booting", detail: "" };
  const dot = card.querySelector(".status-dot");
  const text = card.querySelector(".status-text");

  dot.style.color = statusColor(status.status);
  dot.style.background = statusColor(status.status);
  text.textContent = status.detail ? `${capitalize(status.status)} • ${status.detail}` : capitalize(status.status);
}

function paintMetricCard(providerId) {
  const card = elements.metricsShelf.querySelector(`[data-provider-id="${providerId}"]`);
  if (!card) {
    return;
  }

  const metrics = state.providerMetrics.get(providerId) || {};
  const fields = {
    readyMs: metrics.readyMs ? `${Math.round(metrics.readyMs)} ms` : "--",
    fps: metrics.fps ? metrics.fps.toFixed(1) : "--",
    resourceCount: Number.isFinite(metrics.resourceCount) ? `${metrics.resourceCount}` : "--",
    camera: metrics.camera
      ? `${metrics.camera.lat.toFixed(3)}, ${metrics.camera.lng.toFixed(3)}`
      : "--",
  };

  Object.entries(fields).forEach(([name, value]) => {
    const target = card.querySelector(`[data-field="${name}"]`);
    if (target) {
      target.textContent = value;
    }
  });
}

async function searchCity() {
  const query = elements.citySearch.value.trim();
  if (!query) return;

  elements.citySearchButton.textContent = "…";
  elements.citySearchButton.disabled = true;

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    const results = await res.json();

    if (!results.length) {
      elements.citySearchButton.textContent = "Not found";
      setTimeout(() => { elements.citySearchButton.textContent = "Go"; }, 1500);
      return;
    }

    const place = results[0];
    state.customCenter = {
      lng: parseFloat(place.lon),
      lat: parseFloat(place.lat),
    };

    // Update header
    elements.activePresetName.textContent = place.display_name.split(",")[0];
    elements.activePresetDescription.textContent = place.display_name;

    // Reset zoom/pitch/bearing to good defaults for exploring a new city
    state.settings.zoom = 15.5;
    state.settings.pitch = 60;
    state.settings.bearing = 0;
    syncControlValues();
    broadcastSettings();
  } catch (e) {
    console.error("City search failed:", e);
    elements.citySearchButton.textContent = "Error";
    setTimeout(() => { elements.citySearchButton.textContent = "Go"; }, 1500);
  } finally {
    elements.citySearchButton.disabled = false;
    if (elements.citySearchButton.textContent === "…") {
      elements.citySearchButton.textContent = "Go";
    }
  }
}

function getActivePreset() {
  return state.config.nycPresets.find((preset) => preset.id === state.settings.presetId);
}

function statusColor(status) {
  if (status === "ready") {
    return "var(--success)";
  }

  if (status === "error") {
    return "var(--danger)";
  }

  return "var(--warning)";
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// ─── Keyboard HUD ───

const COLOR_PRESETS = [
  "#ff7a18", "#e03030", "#3b82f6", "#10b981", "#8b5cf6",
  "#f59e0b", "#ec4899", "#06b6d4", "#84cc16", "#ffffff",
  "#000000", "#6b7280",
];

const SURFACE_PRESETS = [
  "#f6efe8", "#ffffff", "#e5e5e5", "#d1d5db", "#1a1a1a",
  "#fef3c7", "#dbeafe", "#d1fae5", "#ede9fe", "#000000",
];

const WEATHER_PRESETS = ["none", "rainy", "snowy", "foggy"];

const KB_BINDINGS = [
  // Camera
  { key: "E", label: "Bearing", setting: "bearing", type: "range", min: 0, max: 359, step: 5, wrap: true, format: (v) => Math.round(v) + "\u00b0" },
  { key: "R", label: "Pitch", setting: "pitch", type: "range", min: 20, max: 85, step: 3, format: (v) => Math.round(v) + "\u00b0" },
  { key: "T", label: "Zoom", setting: "zoom", type: "range", min: 11, max: 18.5, step: 0.3, format: (v) => v.toFixed(1) },
  { key: "G", label: "Preset", setting: "presetId", type: "preset", format: (v) => {
    const p = state.config?.nycPresets?.find((pr) => pr.id === v);
    return p ? p.name : v;
  }},
  // Colors
  { key: "D", label: "Accent color", setting: "accentColor", type: "color", presets: COLOR_PRESETS, format: (v) => v },
  { key: "F", label: "Surface wash", setting: "surfaceColor", type: "color", presets: SURFACE_PRESETS, format: (v) => v },
  { key: "Q", label: "Opacity", setting: "opacity", type: "range", min: 0.2, max: 1, step: 0.05, format: (v) => v.toFixed(2) },
  { key: "W", label: "Height scale", setting: "heightScale", type: "range", min: 0.5, max: 2, step: 0.1, format: (v) => v.toFixed(1) + "x" },
  { key: "V", label: "Vert gradient", setting: "verticalGradient", type: "toggle", format: (v) => v ? "ON" : "OFF" },
  { key: "X", label: "Wireframe", setting: "wireframe", type: "toggle", format: (v) => v ? "ON" : "OFF" },
  { key: "Z", label: "Edge size", setting: "edgeSize", type: "range", min: 0.2, max: 3, step: 0.2, format: (v) => v.toFixed(1) + "px" },
  // Lighting
  { key: "S", label: "Sun / lighting", setting: "sun", type: "toggle", format: (v) => v ? "ON" : "OFF" },
  { key: "I", label: "Light intensity", setting: "lightIntensity", type: "range", min: 0.2, max: 3, step: 0.1, format: (v) => v.toFixed(1) },
  { key: "U", label: "Light angle", setting: "lightAngle", type: "range", min: 0, max: 360, step: 15, wrap: true, format: (v) => Math.round(v) + "\u00b0" },
  { key: "Y", label: "Light altitude", setting: "lightAltitude", type: "range", min: 5, max: 90, step: 5, format: (v) => Math.round(v) + "\u00b0" },
  { key: "H", label: "Shadow darkness", setting: "shadowDarkness", type: "range", min: 0, max: 1, step: 0.05, format: (v) => v.toFixed(2) },
  { key: "J", label: "Ambient occl.", setting: "ambientOcclusion", type: "range", min: 0, max: 1, step: 0.1, format: (v) => v.toFixed(1) },
  // Atmosphere
  { key: "A", label: "Labels", setting: "labels", type: "toggle", format: (v) => v ? "ON" : "OFF" },
  { key: "O", label: "Fog", setting: "fog", type: "toggle", format: (v) => v ? "ON" : "OFF" },
  { key: "P", label: "Fog density", setting: "fogDensity", type: "range", min: 0, max: 1, step: 0.05, format: (v) => v.toFixed(2) },
  { key: "K", label: "Sky", setting: "sky", type: "toggle", format: (v) => v ? "ON" : "OFF" },
  { key: "L", label: "Sky hue shift", setting: "skyHueShift", type: "range", min: -1, max: 1, step: 0.1, format: (v) => v.toFixed(1) },
  { key: "N", label: "Stars", setting: "stars", type: "toggle", format: (v) => v ? "ON" : "OFF" },
  // Material
  { key: "1", label: "Mat. ambient", setting: "materialAmbient", type: "range", min: 0, max: 1, step: 0.05, format: (v) => v.toFixed(2) },
  { key: "2", label: "Mat. diffuse", setting: "materialDiffuse", type: "range", min: 0, max: 1, step: 0.05, format: (v) => v.toFixed(2) },
  { key: "3", label: "Mat. shininess", setting: "materialShininess", type: "range", min: 0, max: 256, step: 16, format: (v) => Math.round(v) },
  // Post-processing
  { key: "B", label: "Bloom", setting: "bloom", type: "toggle", format: (v) => v ? "ON" : "OFF" },
  { key: "M", label: "Bloom intensity", setting: "bloomIntensity", type: "range", min: 0.1, max: 4, step: 0.2, format: (v) => v.toFixed(1) },
  { key: "C", label: "FXAA", setting: "fxaa", type: "toggle", format: (v) => v ? "ON" : "OFF" },
  // ArcGIS-specific
  { key: "4", label: "Weather", setting: "weather", type: "cycle", presets: WEATHER_PRESETS, format: (v) => v },
  { key: "5", label: "Map style", setting: "mapStyle", type: "cycle", presets: MAP_STYLES, format: (v) => v },
];

function initKeyboardHUD() {
  const hud = document.getElementById("kb-hud");
  const grid = document.getElementById("kb-hud-grid");

  function renderHUD() {
    grid.innerHTML = "";
    for (const binding of KB_BINDINGS) {
      const row = document.createElement("div");
      row.className = "kb-hud__row";

      const keyEl = document.createElement("span");
      keyEl.className = "kb-hud__key";
      keyEl.textContent = binding.key;

      const labelEl = document.createElement("span");
      labelEl.className = "kb-hud__label";
      labelEl.textContent = binding.label;

      const valueEl = document.createElement("span");
      const currentValue = state.settings[binding.setting];
      if (binding.type === "color") {
        valueEl.className = "kb-hud__value";
        const swatch = document.createElement("span");
        swatch.className = "kb-hud__value--swatch";
        swatch.style.background = currentValue;
        const text = document.createTextNode(" " + currentValue + " ");
        valueEl.append(swatch, text);
      } else {
        valueEl.className = "kb-hud__value";
        valueEl.textContent = binding.format(currentValue);
      }

      row.append(keyEl, labelEl, valueEl);
      grid.append(row);
    }
  }

  renderHUD();
  initKeyboardHUD.__renderHUD = renderHUD;

  document.addEventListener("keydown", (e) => {
    // Don't capture keys when typing in inputs
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;

    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      hud.classList.toggle("visible");
      if (hud.classList.contains("visible")) renderHUD();
      return;
    }

    // Arrow keys navigate between providers in expanded mode
    if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && elements.comparisonGrid.dataset.expanded) {
      e.preventDefault();
      navigateExpandedProvider(e.key === "ArrowLeft" ? -1 : 1);
      return;
    }

    handleKeyBinding({ key: e.key, code: e.code, shiftKey: e.shiftKey });
    e.preventDefault();
  });
}

function handleKeyBinding({ key, code, shiftKey }) {
  const hud = document.getElementById("kb-hud");
  const grid = document.getElementById("kb-hud-grid");

  if (key === " " || code === "Space") {
    hud.classList.toggle("visible");
    return;
  }

  const binding = KB_BINDINGS.find((b) => b.key === key.toUpperCase());
  if (!binding) return;

  const reverse = shiftKey;

  if (binding.type === "range") {
    let val = state.settings[binding.setting];
    val += reverse ? -binding.step : binding.step;
    if (binding.wrap) {
      if (val > binding.max) val = binding.min;
      if (val < binding.min) val = binding.max;
    } else {
      val = Math.max(binding.min, Math.min(binding.max, val));
    }
    state.settings[binding.setting] = Math.round(val * 1000) / 1000;
  } else if (binding.type === "toggle") {
    state.settings[binding.setting] = !state.settings[binding.setting];
  } else if (binding.type === "color" || binding.type === "cycle") {
    const presets = binding.presets;
    const idx = presets.indexOf(state.settings[binding.setting]);
    const next = reverse
      ? (idx <= 0 ? presets.length - 1 : idx - 1)
      : (idx + 1) % presets.length;
    state.settings[binding.setting] = presets[next];
    if (binding.setting === "accentColor") localStorage.setItem("nyc3d_accentColor", presets[next]);
    if (binding.setting === "surfaceColor") localStorage.setItem("nyc3d_surfaceColor", presets[next]);
  } else if (binding.type === "preset") {
    const presets = state.config.nycPresets;
    const idx = presets.findIndex((p) => p.id === state.settings.presetId);
    const next = reverse
      ? (idx <= 0 ? presets.length - 1 : idx - 1)
      : (idx + 1) % presets.length;
    applyPreset(presets[next].id);
    return;
  }

  syncControlValues();
  broadcastSettings();

  // Update HUD if visible
  if (hud.classList.contains("visible")) {
    initKeyboardHUD.__renderHUD?.();
  }
}

const KEY_MAP = {
  mapboxAccessToken: "keyMapbox",
  googleMapsApiKey: "keyGoogle",
  cesiumIonToken: "keyCesium",
  arcgisApiKey: "keyArcgis",
  appleMapKitToken: "keyApple",
  lumaSplatUrl: "keyLuma",
};

const STORAGE_PREFIX = "nyc3d_key_";

function hydrateApiKeys() {
  for (const [envKey, elKey] of Object.entries(KEY_MAP)) {
    const stored = localStorage.getItem(STORAGE_PREFIX + envKey) || "";
    const serverValue = state.config.env[envKey] || "";
    const effectiveValue = stored || serverValue;

    if (effectiveValue) {
      state.config.env[envKey] = effectiveValue;
    }

    if (elements[elKey]) {
      elements[elKey].value = stored || "";
      elements[elKey].placeholder = serverValue ? "Set via .env (override here)" : elements[elKey].placeholder;
    }
  }
}

function saveApiKeysAndReload() {
  for (const [envKey, elKey] of Object.entries(KEY_MAP)) {
    const value = elements[elKey]?.value?.trim() || "";
    if (value) {
      localStorage.setItem(STORAGE_PREFIX + envKey, value);
      state.config.env[envKey] = value;
    } else {
      localStorage.removeItem(STORAGE_PREFIX + envKey);
    }
  }

  reloadActiveProviders();
}

