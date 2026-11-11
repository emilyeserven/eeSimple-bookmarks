import type { CaptureArea, CaptureDest, CaptureOptions } from "../lib/capture/screenshotCapture";
import type { Bookmark } from "@eesimple/types";

import { apiDelete, sendJson } from "./api";
import { cancelCountdown } from "./countdown";
import { els } from "./dom";
import { session } from "./session";
import {
  captureFullPage,
  captureVisible,
  loadCaptureOptions,
  saveCaptureOptions,
  uploadCapture,
} from "../lib/capture/screenshotCapture";

/*
 * The per-screen bookmark controls shared by the saved / success / review / applied screens: the
 * description editor, "Capture screenshot" (+ its options row), and "Delete bookmark".
 */

// --- Description editor ---------------------------------------------------
interface DescriptionEditor {
  field: HTMLTextAreaElement;
  btn: HTMLButtonElement;
  status: HTMLElement;
}

export const DESCRIPTION_EDITORS = {
  saved: {
    field: els.savedDescription,
    btn: els.saveDescriptionBtn,
    status: els.saveDescriptionStatus,
  },
  review: {
    field: els.reviewDescription,
    btn: els.saveReviewDescriptionBtn,
    status: els.saveReviewDescriptionStatus,
  },
  applied: {
    field: els.appliedDescription,
    btn: els.saveAppliedDescriptionBtn,
    status: els.saveAppliedDescriptionStatus,
  },
} satisfies Record<string, DescriptionEditor>;

/** Prefill an editor with the bookmark's description and wire Save; hidden when there's no bookmark. */
export function wireDescriptionEditor(editor: DescriptionEditor, bookmark: Bookmark | undefined): void {
  editor.field.classList.toggle("hidden", !bookmark);
  editor.btn.classList.toggle("hidden", !bookmark);
  editor.status.textContent = "";
  if (!bookmark) return;
  editor.field.value = bookmark.description ?? "";
  editor.btn.disabled = false;
  editor.btn.textContent = "Save description";
  editor.btn.onclick = () => void saveDescription(bookmark, editor);
}

async function saveDescription(bookmark: Bookmark, editor: DescriptionEditor): Promise<void> {
  cancelCountdown();
  editor.btn.disabled = true;
  editor.btn.textContent = "Saving…";
  editor.status.textContent = "";
  try {
    const res = await sendJson("PATCH", `/api/bookmarks/${bookmark.id}`, {
      description: editor.field.value,
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    // Keep the in-memory bookmark current so another screen's editor sees the latest value.
    bookmark.description = editor.field.value;
    editor.status.textContent = "Saved.";
  }
  catch {
    editor.status.textContent = "Couldn't save. Please try again.";
  }
  editor.btn.disabled = false;
  editor.btn.textContent = "Save description";
}

// --- Screenshot capture ---------------------------------------------------
const CAPTURE_AREA_OPTIONS: [CaptureArea, string][] = [
  ["visible", "Visible area"],
  ["full", "Full page (scroll)"],
];
const CAPTURE_DEST_OPTIONS: [CaptureDest, string][] = [
  ["screenshot", "Save as screenshot"],
  ["images", "Add to bookmark images"],
  ["main", "Add as main image"],
];
const captureOptionsLoaded = loadCaptureOptions();

interface CaptureRow {
  row: HTMLDivElement;
  options: CaptureOptions;
}
const captureRows = new WeakMap<HTMLButtonElement, CaptureRow>();

function buildCaptureSelect<V extends string>(options: [V, string][], value: V, onChange: (value: V) => void): HTMLSelectElement {
  const select = document.createElement("select");
  select.className = "capture-select";
  for (const [optValue, label] of options) {
    const option = document.createElement("option");
    option.value = optValue;
    option.textContent = label;
    select.append(option);
  }
  select.value = value;
  select.onchange = () => onChange(select.value as V);
  return select;
}

/** Lazily create the area/destination options row above a capture button (remembered across popups). */
async function ensureCaptureOptionsRow(btn: HTMLButtonElement): Promise<CaptureRow> {
  const existing = captureRows.get(btn);
  if (existing) return existing;
  const options = await captureOptionsLoaded;
  const row = document.createElement("div");
  row.className = "capture-options";
  row.append(
    buildCaptureSelect(CAPTURE_AREA_OPTIONS, options.area, (value) => {
      options.area = value;
      saveCaptureOptions(options);
    }),
    buildCaptureSelect(CAPTURE_DEST_OPTIONS, options.dest, (value) => {
      options.dest = value;
      saveCaptureOptions(options);
    }),
  );
  btn.before(row);
  const entry = {
    row,
    options,
  };
  captureRows.set(btn, entry);
  return entry;
}

/** Wire a screen's capture button to the bookmark; hidden (with its options) when there's none. */
export function wireCaptureButton(btn: HTMLButtonElement, statusEl: HTMLElement, bookmarkId: string | null | undefined): void {
  statusEl.textContent = "";
  if (!bookmarkId) {
    btn.classList.add("hidden");
    captureRows.get(btn)?.row.classList.add("hidden");
    return;
  }
  btn.classList.remove("hidden");
  btn.disabled = false;
  btn.textContent = "Capture screenshot";
  btn.onclick = () => void captureScreenshot(bookmarkId, btn, statusEl);
  void ensureCaptureOptionsRow(btn).then(({
    row,
  }) => row.classList.remove("hidden"));
}

const CAPTURE_DONE: Record<CaptureDest, string> = {
  screenshot: "Saved as the screenshot",
  main: "Added as the main image",
  images: "Added to the bookmark's images",
};

/** Capture the visible area or the full page and upload it. Never throws; reports inline. */
async function captureScreenshot(bookmarkId: string, btn: HTMLButtonElement, statusEl: HTMLElement): Promise<void> {
  const tab = session.currentTab;
  if (!tab) return;
  cancelCountdown();
  const {
    row, options,
  } = await ensureCaptureOptionsRow(btn);
  const {
    area, dest,
  } = options;
  const setBusy = (busy: boolean) => {
    btn.disabled = busy;
    for (const select of row.querySelectorAll("select")) select.disabled = busy;
  };
  setBusy(true);
  btn.textContent = "Capturing…";
  statusEl.textContent = "";
  try {
    const capture = area === "full"
      ? await captureFullPage(tab, (index, count) => {
        btn.textContent = count > 1 ? `Capturing ${index} of ${count}…` : "Capturing…";
      })
      : await captureVisible(tab);
    if (capture.blob.size === 0) throw new Error("empty capture");
    btn.textContent = "Uploading…";
    await uploadCapture(session.serverUrl, bookmarkId, capture, dest);
    btn.textContent = "Capture another";
    const where = CAPTURE_DONE[dest];
    statusEl.textContent = capture.truncated ? `${where} (page was too long, so it was cut off).` : `${where}.`;
  }
  catch (err) {
    btn.textContent = "Capture screenshot";
    const detail = err instanceof Error && err.message ? ` (${err.message})` : "";
    statusEl.textContent = `Couldn't capture the screenshot${detail}. Please try again.`;
  }
  setBusy(false);
}

// --- Delete bookmark ------------------------------------------------------
/**
 * Wire a screen's delete button. Deletion is permanent, so the first click arms a "Click again to
 * delete" state that reverts after 3s; the second click deletes.
 */
export function wireDeleteButton(btn: HTMLButtonElement, statusEl: HTMLElement, bookmarkId: string | null | undefined): void {
  statusEl.textContent = "";
  if (!bookmarkId) {
    btn.classList.add("hidden");
    return;
  }
  btn.classList.remove("hidden", "confirming");
  btn.disabled = false;
  btn.textContent = "Delete bookmark";
  let revertTimer: ReturnType<typeof setTimeout> | null = null;
  const reset = () => {
    if (revertTimer) clearTimeout(revertTimer);
    revertTimer = null;
    btn.classList.remove("confirming");
    btn.textContent = "Delete bookmark";
  };
  btn.onclick = () => {
    if (btn.classList.contains("confirming")) {
      reset();
      void deleteBookmark(bookmarkId, btn, statusEl);
      return;
    }
    cancelCountdown();
    statusEl.textContent = "";
    btn.classList.add("confirming");
    btn.textContent = "Click again to delete";
    revertTimer = setTimeout(reset, 3000);
  };
}

async function deleteBookmark(bookmarkId: string, btn: HTMLButtonElement, statusEl: HTMLElement): Promise<void> {
  cancelCountdown();
  btn.disabled = true;
  btn.textContent = "Deleting…";
  statusEl.textContent = "";
  try {
    const res = await apiDelete(`/api/bookmarks/${bookmarkId}`);
    // 404 = already gone, same intent.
    if (!res.ok && res.status !== 404) throw new Error(`status ${res.status}`);
    btn.textContent = "Deleted";
    setTimeout(() => window.close(), 800);
  }
  catch {
    btn.disabled = false;
    btn.textContent = "Delete bookmark";
    statusEl.textContent = "Couldn't delete. Please try again.";
  }
}
