import type { PageMetrics } from "./capturePage";
import type { Browser } from "wxt/browser";

import { browser } from "wxt/browser";

import { pagePrepare, pageRestore, pageScrollTo } from "./capturePage";

/*
 * Screenshot capture engine for the popup: the visible area (one captureVisibleTab call) or the full
 * page, captured by scrolling the tab one viewport at a time and stitching the frames on a canvas.
 *
 * Limits:
 * - Chrome throttles captureVisibleTab to ~2 calls/second, so frames are spaced CAPTURE_INTERVAL_MS
 *   apart (a 10-viewport page takes ~6s).
 * - Only the document's own scroll is followed. Pages that scroll an inner container (some web apps)
 *   come out as a single viewport.
 * - Very long pages are cut at MAX_CAPTURE_CSS_HEIGHT; the result reports `truncated: true`.
 * - Fixed/sticky elements (headers, cookie bars) are hidden after the first frame so they aren't
 *   repeated down the stitched image, then restored.
 *
 * Capturing needs no host permission: the popup runs under `activeTab`, granted when the user clicks
 * the toolbar icon.
 */

const CAPTURE_INTERVAL_MS = 600;
const SCROLL_SETTLE_MS = 200;
const MAX_CAPTURE_CSS_HEIGHT = 20000;
// Output caps: the server re-encodes to WebP (max 16383px per side) and accepts uploads up to 8 MB.
const MAX_OUTPUT_WIDTH = 1600;
const MAX_OUTPUT_HEIGHT = 16000;
const MAX_UPLOAD_BYTES = 7.5 * 1024 * 1024;

export type CaptureArea = "visible" | "full";
export type CaptureDest = "screenshot" | "images" | "main";

export interface CaptureOptions {
  area: CaptureArea;
  dest: CaptureDest;
}

export interface Capture {
  blob: Blob;
  truncated: boolean;
  fullPage: boolean;
}

const OPTIONS_KEY = "captureOptions";
const DEFAULT_OPTIONS: CaptureOptions = {
  area: "visible",
  dest: "screenshot",
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}

/** Capture the visible viewport of the tab's window. */
export async function captureVisible(tab: Browser.tabs.Tab): Promise<Capture> {
  const dataUrl = await browser.tabs.captureVisibleTab(tab.windowId, {
    format: "jpeg",
    quality: 92,
  });
  return {
    blob: await dataUrlToBlob(dataUrl),
    truncated: false,
    fullPage: false,
  };
}

interface Frame {
  y: number;
  bitmap: ImageBitmap;
}

async function prepareTab(tabId: number): Promise<PageMetrics> {
  const [injection] = await browser.scripting.executeScript({
    target: {
      tabId,
    },
    func: pagePrepare,
  });
  const metrics = injection?.result;
  if (!metrics?.viewportHeight) throw new Error("Couldn't read the page size.");
  return metrics;
}

async function scrollTab(tabId: number, y: number, hideFixed: boolean): Promise<number> {
  const [injection] = await browser.scripting.executeScript({
    target: {
      tabId,
    },
    func: pageScrollTo,
    args: [y, hideFixed],
  });
  return typeof injection?.result === "number" ? injection.result : y;
}

async function restoreTab(tabId: number): Promise<void> {
  await browser.scripting.executeScript({
    target: {
      tabId,
    },
    func: pageRestore,
  }).catch(() => undefined);
}

/** The scroll offsets of each viewport-sized frame (at least one). */
function framePositions(totalHeight: number, viewportHeight: number): number[] {
  const positions: number[] = [];
  for (let y = 0; y < totalHeight; y += viewportHeight) positions.push(y);
  return positions.length ? positions : [0];
}

/**
 * Scroll the tab top-to-bottom, capturing one frame per viewport. `onProgress` receives
 * (frameIndex, frameCount). The page's scroll position and hidden elements are always restored.
 */
async function captureFrames(
  tab: Browser.tabs.Tab,
  tabId: number,
  positions: number[],
  onProgress?: (index: number, count: number) => void,
): Promise<Frame[]> {
  const frames: Frame[] = [];
  let lastCaptureAt = 0;
  try {
    for (let i = 0; i < positions.length; i++) {
      onProgress?.(i + 1, positions.length);
      const actualY = await scrollTab(tabId, positions[i], i > 0);
      await sleep(SCROLL_SETTLE_MS);
      const wait = CAPTURE_INTERVAL_MS - (Date.now() - lastCaptureAt);
      if (wait > 0) await sleep(wait);
      lastCaptureAt = Date.now();
      const dataUrl = await browser.tabs.captureVisibleTab(tab.windowId, {
        format: "png",
      });
      frames.push({
        y: actualY,
        bitmap: await createImageBitmap(await dataUrlToBlob(dataUrl)),
      });
      // A page that stops scrolling early (shorter than reported) is done.
      if (i > 0 && frames[i].y === frames[i - 1].y) {
        frames.pop()?.bitmap.close();
        break;
      }
    }
  }
  finally {
    await restoreTab(tabId);
  }
  return frames;
}

/** Capture the whole scrolling page of `tab`, stitched into one JPEG. */
export async function captureFullPage(
  tab: Browser.tabs.Tab,
  onProgress?: (index: number, count: number) => void,
): Promise<Capture> {
  const tabId = tab.id;
  if (tabId == null) throw new Error("No tab to capture.");
  const metrics = await prepareTab(tabId);
  const totalHeight = Math.min(metrics.scrollHeight, MAX_CAPTURE_CSS_HEIGHT);
  const frames = await captureFrames(tab, tabId, framePositions(totalHeight, metrics.viewportHeight), onProgress);
  try {
    return {
      blob: await stitchFrames(frames, metrics, totalHeight),
      truncated: metrics.scrollHeight > MAX_CAPTURE_CSS_HEIGHT,
      fullPage: true,
    };
  }
  finally {
    for (const frame of frames) frame.bitmap.close();
  }
}

/** JPEG-encode the canvas, stepping the quality down until it fits the upload cap. */
async function encodeWithinCap(canvas: OffscreenCanvas): Promise<Blob> {
  let blob: Blob | null = null;
  for (const quality of [0.9, 0.8, 0.65, 0.5]) {
    blob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality,
    });
    if (blob.size <= MAX_UPLOAD_BYTES) break;
  }
  if (!blob) throw new Error("Couldn't encode the screenshot.");
  return blob;
}

/**
 * Draw each frame at its scroll offset on one tall canvas, scaled so the output stays within the
 * width/height caps, then encode it.
 */
async function stitchFrames(frames: Frame[], metrics: PageMetrics, totalHeight: number): Promise<Blob> {
  if (frames.length === 0) throw new Error("No frames captured.");
  const first = frames[0].bitmap;
  // Device pixels per CSS pixel, from the actual capture (covers devicePixelRatio and zoom).
  const ratio = first.width / metrics.viewportWidth;
  const cssHeight = Math.min(totalHeight, frames[frames.length - 1].y + metrics.viewportHeight);
  let scale = Math.min(1, MAX_OUTPUT_WIDTH / first.width);
  if (cssHeight * ratio * scale > MAX_OUTPUT_HEIGHT) scale = MAX_OUTPUT_HEIGHT / (cssHeight * ratio);
  const canvas = new OffscreenCanvas(
    Math.max(1, Math.round(first.width * scale)),
    Math.max(1, Math.round(cssHeight * ratio * scale)),
  );
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");
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
  return encodeWithinCap(canvas);
}

/** The server's error message from a failed response, else the status. */
async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json() as { message?: unknown } | null;
    if (typeof body?.message === "string") return body.message;
  }
  catch {
    // Non-JSON error body: keep the status text.
  }
  return `status ${res.status}`;
}

/**
 * Upload a capture either to the bookmark's single screenshot slot or into its image gallery
 * (optionally as the main image). Full-page captures pass `fullPage=true` so the server bounds the
 * width instead of the longest edge.
 */
export async function uploadCapture(serverUrl: string, bookmarkId: string, capture: Capture, dest: CaptureDest): Promise<void> {
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
  if (!res.ok) throw new Error(await errorMessage(res));
}

/** The remembered area/destination choice (defaults when unset or unreadable). */
export async function loadCaptureOptions(): Promise<CaptureOptions> {
  try {
    const stored = await browser.storage.local.get(OPTIONS_KEY);
    return {
      ...DEFAULT_OPTIONS,
      ...(stored[OPTIONS_KEY] as Partial<CaptureOptions> | undefined),
    };
  }
  catch {
    return {
      ...DEFAULT_OPTIONS,
    };
  }
}

export function saveCaptureOptions(options: CaptureOptions): void {
  browser.storage.local.set({
    [OPTIONS_KEY]: options,
  }).catch(() => undefined);
}
