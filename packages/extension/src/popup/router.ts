import type { ExtensionFillContext } from "@eesimple/types";

import { fetchFillContext, jsonOrEmpty, sendJson } from "./api";
import { cancelCountdown, startCountdown } from "./countdown";
import { els, show } from "./dom";
import { enterFillMode } from "./fillMode";
import { readPendingSelector, showSelectorPrefill, wireFindSelectorButton } from "./findSelector";
import { gateRules } from "./gate";
import { onBookmarkSuccess, openInbox, renderSaved } from "./screens";
import { session } from "./session";

/*
 * Route the popup by what the server knows about the current URL:
 *   unknown            → auto-save to the Inbox, then offer "Move to Bookmarks" / "View Inbox"
 *   inbox              → "already in your inbox" + the same Move to Bookmarks affordance
 *   taxonomy + rules   → fill the taxonomy entity directly
 *   bookmark + rules   → fill mode (scrape, review, apply)
 *   bookmark, no rules → "already saved"
 *   fill-context fails → the editable add form (never regress saving)
 */

/** The manual add form — the fallback when the server can't be asked or the URL is unusable. */
export function showAddForm(): void {
  show("form");
}

/**
 * Fetch the fill-context and route. `autoSave` gates the `unknown` auto-save (true on the first boot,
 * false when re-routing after a 409 so we never re-POST in a loop).
 */
export async function bootFillContext(url: string, autoSave = true): Promise<void> {
  let ctx: ExtensionFillContext;
  try {
    ctx = await fetchFillContext(url);
  }
  catch {
    showAddForm();
    return;
  }
  // A selector picked on this page takes priority — finish creating its rule.
  const pending = await readPendingSelector(url);
  if (pending) {
    void showSelectorPrefill(ctx, pending, () => routeByMode(ctx, url, false));
    return;
  }
  routeByMode(ctx, url, autoSave);
}

function saveUnknown(url: string, autoSave: boolean): void {
  if (autoSave) void autoSaveToInbox(url);
  else showAddForm();
}

export function routeByMode(ctx: ExtensionFillContext, url: string, autoSave = true): void {
  const allRules = gateRules(ctx.website?.extensionFillRules ?? [], url);
  switch (ctx.mode) {
    case "unknown":
      saveUnknown(url, autoSave);
      return;
    case "inbox":
      renderInboxSaved(ctx.inboxItemId, url, "Already in your inbox.");
      return;
    case "taxonomy": {
      // The page is a taxonomy entity's source — fill it directly. If no rule applies, don't leave the
      // page unsaved: fall back to the unknown behavior.
      const rules = allRules.filter(rule => rule.target.kind === "taxonomyDirect");
      if (rules.length === 0) saveUnknown(url, autoSave);
      else void enterFillMode(ctx, rules);
      return;
    }
    case "bookmark":
      if (allRules.length === 0) renderSaved(ctx.bookmark);
      else void enterFillMode(ctx, allRules);
      return;
    default:
      showAddForm();
  }
}

/** POST to the Inbox; the `unknown` path and the add form share it. */
export function postToInbox(url: string): Promise<Response> {
  return sendJson("POST", "/api/bookmarks/inbox", {
    url,
    title: session.pageTitle || url,
  });
}

/** Auto-save on popup open. On 409 the URL is already saved/pending, so re-route without re-saving. */
async function autoSaveToInbox(url: string): Promise<void> {
  try {
    const res = await postToInbox(url);
    if (res.status === 201) {
      const data = await jsonOrEmpty<{ id: string }>(res);
      renderInboxSaved(data.id, url, "Saved to Inbox.");
    }
    else if (res.status === 409) {
      void bootFillContext(url, false);
    }
    else {
      showAddForm();
    }
  }
  catch {
    showAddForm();
  }
}

// --- Inbox-saved lander ---------------------------------------------------
function resetInboxError(): void {
  els.inboxSavedError.classList.add("hidden");
  els.inboxSavedError.textContent = "";
}

function showInboxError(message: string): void {
  els.inboxSavedError.textContent = message;
  els.inboxSavedError.classList.remove("hidden");
}

function resetInboxButtons(): void {
  els.moveToBookmarksBtn.disabled = false;
  els.moveToBookmarksBtn.textContent = "Move to Bookmarks";
  els.inboxUndoBtn.disabled = false;
  els.inboxUndoBtn.textContent = "Undo";
}

/**
 * "View Inbox" is always offered; "Move to Bookmarks" and "Undo" only when we hold the pending
 * import-item id (from the inbox POST or fill-context's `inboxItemId`).
 */
export function renderInboxSaved(itemId: string | undefined, url: string, message: string): void {
  els.inboxSavedMsg.textContent = message;
  resetInboxError();
  els.inboxSavedViewBtn.onclick = openInbox;
  els.moveToBookmarksBtn.classList.toggle("hidden", !itemId);
  els.inboxUndoBtn.classList.toggle("hidden", !itemId);
  if (itemId) {
    resetInboxButtons();
    els.moveToBookmarksBtn.onclick = () => void moveToBookmarks(itemId, url);
    els.inboxUndoBtn.onclick = () => void undoInboxSave(itemId);
  }
  // Let the user bootstrap this site's first fill rule straight from the lander.
  wireFindSelectorButton(els.findSelectorInboxBtn, els.findSelectorInboxStatus);
  show("inboxSaved");
  startCountdown();
}

/** Reject the pending import item. A 404 means it's already gone — same intent, so success. */
async function undoInboxSave(itemId: string): Promise<void> {
  cancelCountdown();
  resetInboxError();
  els.inboxUndoBtn.disabled = true;
  els.inboxUndoBtn.textContent = "Undoing…";
  els.moveToBookmarksBtn.disabled = true;
  try {
    const res = await sendJson("POST", `/api/imports/items/${itemId}/reject`, {});
    if (!res.ok && res.status !== 404) throw new Error(`status ${res.status}`);
    els.inboxSavedMsg.textContent = "Removed from Inbox.";
    els.moveToBookmarksBtn.classList.add("hidden");
    els.inboxUndoBtn.classList.add("hidden");
    startCountdown();
  }
  catch {
    resetInboxButtons();
    showInboxError("Couldn't undo. Please try again.");
  }
}

/** Promote the pending item to a bookmark, then flow into the shared post-create step. */
async function moveToBookmarks(itemId: string, url: string): Promise<void> {
  cancelCountdown();
  resetInboxError();
  els.moveToBookmarksBtn.disabled = true;
  els.moveToBookmarksBtn.textContent = "Moving…";
  try {
    const res = await sendJson("POST", `/api/imports/items/${itemId}/approve`, {});
    if (!res.ok) throw new Error(`status ${res.status}`);
    // approved | duplicate | skipped all carry a bookmarkId; error carries none.
    const {
      bookmarkId,
    } = await jsonOrEmpty<{ bookmarkId: string }>(res);
    if (!bookmarkId) throw new Error("no bookmark id");
    await afterBookmarkCreated(bookmarkId, url);
  }
  catch {
    els.moveToBookmarksBtn.disabled = false;
    els.moveToBookmarksBtn.textContent = "Move to Bookmarks";
    showInboxError("Couldn't move to Bookmarks. Please try again.");
  }
}

/**
 * After a bookmark is created: if the site has fill rules for this page, flow straight into fill mode;
 * otherwise show the bookmark success screen.
 */
export async function afterBookmarkCreated(bookmarkId: string | undefined, url: string): Promise<void> {
  try {
    const ctx = await fetchFillContext(url);
    const rules = gateRules(ctx.website?.extensionFillRules ?? [], url);
    if (ctx.mode === "bookmark" && rules.length > 0) {
      void enterFillMode(ctx, rules);
      return;
    }
  }
  catch {
    // Couldn't check for fill rules — just report the bookmark was created.
  }
  onBookmarkSuccess("Added as bookmark.", bookmarkId);
}
