/* global chrome */
// Screenshot capture engine for the extension popup: the visible area (one captureVisibleTab call)
// or the full page, captured by scrolling the tab one viewport at a time and stitching the frames
// on a canvas. Loaded before popup.js and exposed as the `EesimpleCapture` global.
//
// Limits:
// - Chrome throttles captureVisibleTab to ~2 calls/second, so frames are spaced CAPTURE_INTERVAL_MS
//   apart (a 10-viewport page takes ~6s).
// - Only the document's own scroll is followed. Pages that scroll an inner container (some web apps)
//   come out as a single viewport.
// - Very long pages are cut at MAX_CAPTURE_CSS_HEIGHT; the result reports `truncated: true`.
// - Fixed/sticky elements (headers, cookie bars) are hidden after the first frame so they aren't
//   repeated down the stitched image, then restored.
(function () {
  const CAPTURE_INTERVAL_MS = 600;
  const SCROLL_SETTLE_MS = 200;
  const MAX_CAPTURE_CSS_HEIGHT = 20000;
  // Output caps: the server re-encodes to WebP (max 16383px per side) and accepts uploads up to 8 MB.
  const MAX_OUTPUT_WIDTH = 1600;
  const MAX_OUTPUT_HEIGHT = 16000;
  const MAX_UPLOAD_BYTES = 7.5 * 1024 * 1024;

  const OPTIONS_KEY = "captureOptions";
  const DEFAULT_OPTIONS = {
    area: "visible",
    dest: "screenshot",
  };

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  // --- Injected page functions (serialized into the tab; must be self-contained) ---------------

  function pagePrepare() {
    const root = document.documentElement;
    const state = {
      x: window.scrollX,
      y: window.scrollY,
      scrollBehavior: root.style.scrollBehavior,
      hidden: [],
    };
    window.__eesimpleCaptureState = state;
    // Smooth scrolling would make the scrollTo below land late.
    root.style.scrollBehavior = "auto";
    const body = document.body;
    const scrollHeight = Math.max(
      root.scrollHeight,
      body ? body.scrollHeight : 0,
      root.offsetHeight,
      body ? body.offsetHeight : 0,
    );
    return {
      scrollHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  }

  function pageScrollTo(y, hideFixed) {
    const state = window.__eesimpleCaptureState;
    if (hideFixed && state && !state.fixedScanned) {
      state.fixedScanned = true;
      for (const el of document.querySelectorAll("body *")) {
        const position = getComputedStyle(el).position;
        if (position !== "fixed" && position !== "sticky") continue;
        state.hidden.push([el, el.style.getPropertyValue("visibility"), el.style.getPropertyPriority("visibility")]);
        el.style.setProperty("visibility", "hidden", "important");
      }
    }
    window.scrollTo(0, y);
    return window.scrollY;
  }

  function pageRestore() {
    const state = window.__eesimpleCaptureState;
    if (!state) return;
    for (const [el, value, priority] of state.hidden) {
      if (value) el.style.setProperty("visibility", value, priority);
      else el.style.removeProperty("visibility");
    }
    document.documentElement.style.scrollBehavior = state.scrollBehavior;
    window.scrollTo(state.x, state.y);
    delete window.__eesimpleCaptureState;
  }

  async function runInTab(tabId, func, args) {
    const [injection] = await chrome.scripting.executeScript({
      target: {
        tabId,
      },
      func,
      args: args ?? [],
    });
    return injection ? injection.result : undefined;
  }

  // --- Capture -----------------------------------------------------------------------------------

  async function captureVisible(tab) {
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: "jpeg",
      quality: 92,
    });
    const blob = await (await fetch(dataUrl)).blob();
    return {
      blob,
      truncated: false,
      fullPage: false,
    };
  }

  // Scroll the tab top-to-bottom, capturing one frame per viewport, then stitch them. `onProgress`
  // receives (frameIndex, frameCount). The page's scroll position and hidden elements are always
  // restored, even when a capture fails.
  async function captureFullPage(tab, onProgress) {
    const tabId = tab.id;
    const metrics = await runInTab(tabId, pagePrepare);
    if (!metrics || !metrics.viewportHeight) throw new Error("Couldn't read the page size.");
    const totalHeight = Math.min(metrics.scrollHeight, MAX_CAPTURE_CSS_HEIGHT);
    const truncated = metrics.scrollHeight > MAX_CAPTURE_CSS_HEIGHT;
    const positions = [];
    for (let y = 0; y < totalHeight; y += metrics.viewportHeight) positions.push(y);
    if (positions.length === 0) positions.push(0);

    const frames = [];
    let lastCaptureAt = 0;
    try {
      for (let i = 0; i < positions.length; i++) {
        if (onProgress) onProgress(i + 1, positions.length);
        const actualY = await runInTab(tabId, pageScrollTo, [positions[i], i > 0]);
        await sleep(SCROLL_SETTLE_MS);
        const wait = CAPTURE_INTERVAL_MS - (Date.now() - lastCaptureAt);
        if (wait > 0) await sleep(wait);
        lastCaptureAt = Date.now();
        const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
          format: "png",
        });
        frames.push({
          y: typeof actualY === "number" ? actualY : positions[i],
          bitmap: await createImageBitmap(await (await fetch(dataUrl)).blob()),
        });
        // A page that stops scrolling early (shorter than reported) is done.
        if (i > 0 && frames[i].y === frames[i - 1].y) {
          frames.pop();
          break;
        }
      }
    }
    finally {
      await runInTab(tabId, pageRestore).catch(() => undefined);
    }

    const blob = await stitchFrames(frames, metrics, totalHeight);
    for (const frame of frames) frame.bitmap.close();
    return {
      blob,
      truncated,
      fullPage: true,
    };
  }

  // Draw each frame at its scroll offset on one tall canvas, scaled so the output stays within the
  // width/height caps, then JPEG-encode it, stepping the quality down until it fits the upload cap.
  async function stitchFrames(frames, metrics, totalHeight) {
    if (frames.length === 0) throw new Error("No frames captured.");
    const first = frames[0].bitmap;
    // Device pixels per CSS pixel, from the actual capture (covers devicePixelRatio and zoom).
    const ratio = first.width / metrics.viewportWidth;
    const lastFrame = frames[frames.length - 1];
    const cssHeight = Math.min(totalHeight, lastFrame.y + metrics.viewportHeight);
    let scale = Math.min(1, MAX_OUTPUT_WIDTH / first.width);
    if (cssHeight * ratio * scale > MAX_OUTPUT_HEIGHT) scale = MAX_OUTPUT_HEIGHT / (cssHeight * ratio);
    const canvas = new OffscreenCanvas(
      Math.max(1, Math.round(first.width * scale)),
      Math.max(1, Math.round(cssHeight * ratio * scale)),
    );
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const frame of frames) {
      ctx.drawImage(
        frame.bitmap,
        0,
        Math.round(frame.y * ratio * scale),
        Math.round(frame.bitmap.width * scale),
        Math.round(frame.bitmap.height * scale),
      );
    }
    let blob = null;
    for (const quality of [0.9, 0.8, 0.65, 0.5]) {
      blob = await canvas.convertToBlob({
        type: "image/jpeg",
        quality,
      });
      if (blob.size <= MAX_UPLOAD_BYTES) break;
    }
    return blob;
  }

  // --- Upload ------------------------------------------------------------------------------------

  // Upload a capture either to the bookmark's single screenshot slot or into its image gallery
  // (optionally as the main image). Full-page captures pass `fullPage=true` so the server bounds the
  // width instead of the longest edge.
  async function uploadCapture(serverUrl, bookmarkId, capture, dest) {
    const params = new URLSearchParams();
    if (capture.fullPage) params.set("fullPage", "true");
    if (dest === "main") params.set("main", "true");
    const path = dest === "screenshot" ? "screenshot/upload" : "images";
    const query = params.toString() ? `?${params}` : "";
    const form = new FormData();
    form.append("file", capture.blob, capture.fullPage ? "full-page-screenshot.jpg" : "screenshot.jpg");
    const res = await fetch(`${serverUrl}/api/bookmarks/${bookmarkId}/${path}${query}`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      let message = `status ${res.status}`;
      try {
        const body = await res.json();
        if (body && typeof body.message === "string") message = body.message;
      }
      catch {
        // Non-JSON error body: keep the status text.
      }
      throw new Error(message);
    }
  }

  // --- Remembered options --------------------------------------------------------------------------

  async function loadOptions() {
    try {
      const stored = await chrome.storage.local.get(OPTIONS_KEY);
      return {
        ...DEFAULT_OPTIONS,
        ...(stored[OPTIONS_KEY] ?? {}),
      };
    }
    catch {
      return {
        ...DEFAULT_OPTIONS,
      };
    }
  }

  function saveOptions(options) {
    chrome.storage.local.set({
      [OPTIONS_KEY]: options,
    }).catch(() => undefined);
  }

  window.EesimpleCapture = {
    captureVisible,
    captureFullPage,
    uploadCapture,
    loadOptions,
    saveOptions,
  };
})();
