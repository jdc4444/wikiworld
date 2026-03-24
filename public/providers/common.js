const SHELL_SOURCE = "nyc-3d-stack-tester-shell";
const PROVIDER_SOURCE = "nyc-3d-stack-tester-provider";

function estimateFps(sampleMs = 1200) {
  return new Promise((resolve) => {
    let frames = 0;
    let start = 0;

    const step = (timestamp) => {
      if (!start) {
        start = timestamp;
      }

      frames += 1;
      const elapsed = timestamp - start;
      if (elapsed >= sampleMs) {
        resolve((frames * 1000) / elapsed);
        return;
      }

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  });
}

export async function createProviderRuntime(options) {
  const searchParams = new URLSearchParams(window.location.search);
  const providerId = searchParams.get("provider") || options.providerId;
  const config = await fetch("/api/config").then((response) => response.json());

  // Override config keys with any passed via query params (from browser-side key input)
  const qp = new URLSearchParams(window.location.search);
  for (const envKey of Object.keys(config.env || {})) {
    const override = qp.get(envKey);
    if (override) {
      config.env[envKey] = override;
    }
  }
  const initialPreset =
    config.nycPresets.find((preset) => preset.id === config.defaultSettings.presetId) || config.nycPresets[0];
  let settings = {
    ...config.defaultSettings,
    center: initialPreset?.center,
    altitudeMeters: initialPreset?.altitudeMeters,
  };
  let readyAt = null;

  const send = (type, payload = {}) => {
    window.parent.postMessage(
      {
        source: PROVIDER_SOURCE,
        providerId,
        type,
        payload,
      },
      window.location.origin,
    );
  };

  const status = (value, detail = "") => {
    send("status", {
      status: value,
      detail,
      capabilities: options.capabilities || [],
    });
  };

  const ready = (detail = "") => {
    readyAt = performance.now();
    send("ready", {
      detail,
      capabilities: options.capabilities || [],
    });
  };

  const fallback = (title, message) => {
    const existing = document.querySelector(".provider-fallback");
    if (existing) {
      existing.remove();
    }

    const wrapper = document.createElement("div");
    wrapper.className = "provider-fallback";
    wrapper.innerHTML = `
      <div class="provider-fallback__card">
        <h1>${title}</h1>
        <p>${message}</p>
      </div>
    `;
    document.body.append(wrapper);
  };

  async function reportMetrics(getCamera) {
    const fps = await estimateFps();
    const resources = performance.getEntriesByType("resource");

    send("metrics", {
      readyMs: readyAt,
      fps,
      resourceCount: resources.length,
      camera: getCamera ? getCamera() : null,
    });
  }

  async function applySettings(nextSettings) {
    settings = { ...settings, ...nextSettings };
    if (options.onSettings) {
      await options.onSettings(settings);
    }
    reportMetrics(options.getCamera).catch(() => {});
  }

  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) {
      return;
    }

    const { data } = event;
    if (!data || data.source !== SHELL_SOURCE) {
      return;
    }

    if (data.providerId && data.providerId !== providerId) {
      return;
    }

    if (data.type === "apply-settings") {
      applySettings(data.payload).catch((error) => {
        status("error", error.message);
      });
      return;
    }

    if (data.type === "reload-provider") {
      window.location.reload();
    }
  });

  window.addEventListener("error", (event) => {
    const message = event.message || String(event.error || "");
    if (!message || message === "Script error." || message === "Uncaught [object Object]") {
      return;
    }
    status("error", message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const message =
      typeof event.reason === "string" ? event.reason : event.reason?.message || String(event.reason || "");
    if (!message || message === "[object Object]") {
      return;
    }
    status("error", message);
  });

  // Forward keyboard events to parent shell so the HUD works in fullscreen
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    window.parent.postMessage({
      source: PROVIDER_SOURCE,
      providerId,
      type: "keydown",
      payload: { key: e.key, code: e.code, shiftKey: e.shiftKey },
    }, window.location.origin);
  });

  status("booting", "Loading");

  return {
    config,
    settings,
    providerId,
    send,
    status,
    ready,
    fallback,
    applySettings,
    reportMetrics: () => reportMetrics(options.getCamera),
  };
}

export function attachOverlay(title, note) {
  // Overlays removed — descriptions are shown in the shell card headers
}

export function zoomToRangeMeters(zoom, latDeg = 40.76, viewportHeight = 500) {
  // Computes slant-distance (range) from camera to look-at target in meters,
  // matching the MapLibre/Mapbox camera model where zoom determines scale at
  // the map center and the camera is positioned behind that center point.
  //
  //   cameraDist (px)  = (viewportHeight / 2) / tan(fov / 2)
  //   metersPerPx      = C·cos(lat) / (tileSize · 2^zoom)
  //   range            = cameraDist · metersPerPx
  //
  // Use with Cesium lookAt(target, HeadingPitchRange(h, p, range)) for
  // pixel-accurate parity with MapLibre at any pitch/zoom/lat.
  const EARTH_C = 40075017;          // circumference in meters
  const TILE_SIZE = 512;             // MapLibre default
  const FOV = 0.6435;               // 36.87° — MapLibre default vertical FOV

  const latRad = latDeg * Math.PI / 180;

  const cameraDistPx = (viewportHeight / 2) / Math.tan(FOV / 2);
  const metersPerPx  = (EARTH_C * Math.cos(latRad)) / (TILE_SIZE * Math.pow(2, zoom));

  // Scale up to match ArcGIS framing (ArcGIS zoom levels map to wider views)
  const ARCGIS_SCALE = 2.0;
  return Math.max(100, cameraDistPx * metersPerPx * ARCGIS_SCALE);
}

export function zoomToAltitudeMeters(zoom, pitchDeg = 0, latDeg = 40.76, viewportHeight = 500) {
  // Derives altitude from range for providers that set camera position (ArcGIS).
  const range = zoomToRangeMeters(zoom, latDeg, viewportHeight);
  const pitchRad = pitchDeg * Math.PI / 180;
  return Math.max(100, range * Math.cos(pitchRad));
}
