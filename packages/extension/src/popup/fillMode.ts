import type { FillRow } from "./fill/rowTypes";
import type { FillRunResult } from "../lib/fill/fillEngine";
import type { Bookmark, ExtensionFillContext, WebsiteExtensionFillRule } from "@eesimple/types";

import { browser } from "wxt/browser";

import {
  DESCRIPTION_EDITORS,
  wireCaptureButton,
  wireDeleteButton,
  wireDescriptionEditor,
} from "./bookmarkActions";
import { els, show } from "./dom";
import { applyChanges, hasImageHostAccess, requestImageHostAccess } from "./fill/apply";
import { buildRow } from "./fill/buildRow";
import { appendGroupedRows } from "./fill/reviewRows";
import { wireFindSelectorButton } from "./findSelector";
import { openBookmark, session } from "./session";

/*
 * Fill mode: inject the engine into the page, run the website's rules, review the proposed changes,
 * and apply the checked ones.
 */

function screenTitle(bookmark: Bookmark | undefined, ctx?: ExtensionFillContext): string {
  return bookmark?.title ?? session.currentTab?.title ?? ctx?.website?.siteName ?? "";
}

/** Two-step injection: load the engine into the page, then call it with the rules. */
async function injectAndRun(rules: readonly WebsiteExtensionFillRule[]): Promise<FillRunResult[]> {
  const tabId = session.currentTab?.id;
  if (tabId == null) throw new Error("no tab");
  await browser.scripting.executeScript({
    target: {
      tabId,
    },
    files: ["/fillEngine.js"],
  });
  const injected = await browser.scripting.executeScript({
    target: {
      tabId,
    },
    func: (r: WebsiteExtensionFillRule[]) => {
      if (!globalThis.eesimpleFillEngine) throw new Error("fillEngine.js did not load");
      return globalThis.eesimpleFillEngine.runRules(r);
    },
    args: [rules as WebsiteExtensionFillRule[]],
  });
  return (injected[0]?.result as FillRunResult[] | undefined) ?? [];
}

/** The review screen's shared bookmark controls (open, description, screenshot). */
function wireReviewControls(bookmark: Bookmark | undefined): void {
  // No bookmark (taxonomy mode) → nothing to open.
  els.fillReviewOpenBtn.classList.toggle("hidden", !bookmark);
  els.fillReviewOpenBtn.onclick = () => openBookmark(bookmark?.id);
  wireDescriptionEditor(DESCRIPTION_EDITORS.review, bookmark);
  wireCaptureButton(els.captureReviewBtn, els.captureReviewStatus, bookmark?.id);
}

function showReviewError(bookmark: Bookmark | undefined, message: string): void {
  els.fillReviewTitle.textContent = screenTitle(bookmark);
  els.fillError.textContent = message;
  els.fillError.classList.remove("hidden");
  els.fillRows.replaceChildren();
  els.fillApplyBtn.classList.add("hidden");
  wireReviewControls(bookmark);
  show("review");
}

function renderApplied(bookmark: Bookmark | undefined, message: string): void {
  els.fillAppliedMsg.textContent = message;
  els.fillAppliedOpenBtn.classList.toggle("hidden", !bookmark);
  els.fillAppliedOpenBtn.onclick = () => openBookmark(bookmark?.id);
  wireDescriptionEditor(DESCRIPTION_EDITORS.applied, bookmark);
  wireCaptureButton(els.captureAppliedBtn, els.captureAppliedStatus, bookmark?.id);
  wireDeleteButton(els.deleteAppliedBtn, els.deleteAppliedStatus, bookmark?.id);
  show("applied");
}

function onApplyClick(rows: readonly FillRow[], bookmark: Bookmark | undefined, hostsGranted: boolean): void {
  // Request image-host access first, synchronously inside the click (a user gesture). Skipped when the
  // hosts were already granted, so the common case never shows a prompt.
  const access = hostsGranted ? Promise.resolve(true) : requestImageHostAccess(rows.filter(row => row.checkbox?.checked));
  els.fillApplyBtn.disabled = true;
  els.fillApplyBtn.textContent = "Applying…";
  els.fillError.classList.add("hidden");
  void access
    .then(() => applyChanges(rows, bookmark))
    .then(message => renderApplied(bookmark, message))
    .catch(() => {
      els.fillApplyBtn.disabled = false;
      els.fillApplyBtn.textContent = "Apply";
      els.fillError.textContent = "Couldn't apply the changes. Please try again.";
      els.fillError.classList.remove("hidden");
    });
}

function renderReview(ctx: ExtensionFillContext, rows: FillRow[]): void {
  const bookmark = ctx.bookmark;
  els.fillReviewTitle.textContent = screenTitle(bookmark);
  els.fillError.classList.add("hidden");
  els.fillError.textContent = "";
  els.fillApplyBtn.classList.remove("hidden");
  els.fillApplyBtn.disabled = false;
  els.fillApplyBtn.textContent = "Apply";
  els.fillRows.replaceChildren();
  // Selection/apply run off the `rows` array, so grouping the DOM never affects them.
  appendGroupedRows(els.fillRows, rows, ctx.website?.extensionFillRuleGroups ?? []);
  wireReviewControls(bookmark);
  wireFindSelectorButton(els.findSelectorReviewBtn, els.findSelectorReviewStatus);
  let hostsGranted = false;
  void hasImageHostAccess(rows).then((granted) => {
    hostsGranted = granted;
  });
  els.fillApplyBtn.onclick = () => onApplyClick(rows, bookmark, hostsGranted);
  show("review");
}

export async function enterFillMode(ctx: ExtensionFillContext, rules: readonly WebsiteExtensionFillRule[]): Promise<void> {
  const bookmark = ctx.bookmark;
  els.fillFillingTitle.textContent = screenTitle(bookmark, ctx);
  show("filling");
  let results: FillRunResult[];
  try {
    results = await injectAndRun(rules);
  }
  catch {
    // Restricted page (chrome://, the Web Store, a PDF viewer, …) — can't inject.
    showReviewError(bookmark, "Couldn't read this page — it may be a browser page that extensions can't access.");
    return;
  }
  let rows: FillRow[];
  try {
    rows = rules.map(rule => buildRow(rule, results.find(r => r.ruleId === rule.id), ctx));
  }
  catch {
    // A malformed rule/result shouldn't leave the popup stuck on "Reading the page…".
    showReviewError(bookmark, "Couldn't prepare the changes for this page.");
    return;
  }
  renderReview(ctx, rows);
}
