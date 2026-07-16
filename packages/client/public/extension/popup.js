/* global chrome */
const AUTO_CLOSE_MS = 5000; // keep in sync with the #progressBar animation duration in popup.html

const setupEl = document.getElementById("setup");
const formEl = document.getElementById("form");
const successEl = document.getElementById("success");

const urlInput = document.getElementById("serverUrl");
const saveBtn = document.getElementById("saveBtn");
const statusEl = document.getElementById("status");

const bmUrl = document.getElementById("bmUrl");
const addBtn = document.getElementById("addBtn");
const addBookmarkBtn = document.getElementById("addBookmarkBtn");
const formError = document.getElementById("formError");

const successMsg = document.getElementById("successMsg");
const viewInboxBtn = document.getElementById("viewInboxBtn");

const progressEl = document.getElementById("progress");
const progressBar = document.getElementById("progressBar");

// Inbox auto-saved screen (auto-save on open → Move to Bookmarks / View Inbox)
const inboxSavedEl = document.getElementById("inboxSaved");
const inboxSavedMsg = document.getElementById("inboxSavedMsg");
const moveToBookmarksBtn = document.getElementById("moveToBookmarksBtn");
const inboxSavedViewBtn = document.getElementById("inboxSavedViewBtn");
const inboxUndoBtn = document.getElementById("inboxUndoBtn");
const inboxSavedError = document.getElementById("inboxSavedError");
// Fill-mode screens
const savedStateEl = document.getElementById("savedState");
const savedOpenBtn = document.getElementById("savedOpenBtn");
const savedDescription = document.getElementById("savedDescription");
const saveDescriptionBtn = document.getElementById("saveDescriptionBtn");
const saveDescriptionStatus = document.getElementById("saveDescriptionStatus");
const reviewDescription = document.getElementById("reviewDescription");
const saveReviewDescriptionBtn = document.getElementById("saveReviewDescriptionBtn");
const saveReviewDescriptionStatus = document.getElementById("saveReviewDescriptionStatus");
const appliedDescription = document.getElementById("appliedDescription");
const saveAppliedDescriptionBtn = document.getElementById("saveAppliedDescriptionBtn");
const saveAppliedDescriptionStatus = document.getElementById("saveAppliedDescriptionStatus");
const fillFillingEl = document.getElementById("fillFilling");
const fillFillingTitle = document.getElementById("fillFillingTitle");
const fillReviewEl = document.getElementById("fillReview");
const fillReviewTitle = document.getElementById("fillReviewTitle");
const fillError = document.getElementById("fillError");
const fillRows = document.getElementById("fillRows");
const fillApplyBtn = document.getElementById("fillApplyBtn");
const fillReviewOpenBtn = document.getElementById("fillReviewOpenBtn");
const captureReviewBtn = document.getElementById("captureReviewBtn");
const captureReviewStatus = document.getElementById("captureReviewStatus");
const fillAppliedEl = document.getElementById("fillApplied");
const fillAppliedMsg = document.getElementById("fillAppliedMsg");
const fillAppliedOpenBtn = document.getElementById("fillAppliedOpenBtn");
// Screenshot-capture controls (one per bookmark-context terminal screen)
const captureSavedBtn = document.getElementById("captureSavedBtn");
const captureSavedStatus = document.getElementById("captureSavedStatus");
const captureSuccessBtn = document.getElementById("captureSuccessBtn");
const captureSuccessStatus = document.getElementById("captureSuccessStatus");
const captureAppliedBtn = document.getElementById("captureAppliedBtn");
const captureAppliedStatus = document.getElementById("captureAppliedStatus");
// Delete-bookmark controls (one per bookmark-context terminal screen)
const deleteSavedBtn = document.getElementById("deleteSavedBtn");
const deleteSavedStatus = document.getElementById("deleteSavedStatus");
const deleteSuccessBtn = document.getElementById("deleteSuccessBtn");
const deleteSuccessStatus = document.getElementById("deleteSuccessStatus");
const deleteAppliedBtn = document.getElementById("deleteAppliedBtn");
const deleteAppliedStatus = document.getElementById("deleteAppliedStatus");
// Selector-finder ("Find a selector") controls
const findSelectorSavedBtn = document.getElementById("findSelectorSavedBtn");
const findSelectorSavedStatus = document.getElementById("findSelectorSavedStatus");
const findSelectorReviewBtn = document.getElementById("findSelectorReviewBtn");
const findSelectorReviewStatus = document.getElementById("findSelectorReviewStatus");
const selectorPrefillEl = document.getElementById("selectorPrefill");
const prefillSummary = document.getElementById("prefillSummary");
const prefillLabel = document.getElementById("prefillLabel");
const prefillTarget = document.getElementById("prefillTarget");
const prefillEntryType = document.getElementById("prefillEntryType");
const prefillCreateBtn = document.getElementById("prefillCreateBtn");
const prefillDiscardBtn = document.getElementById("prefillDiscardBtn");
const prefillError = document.getElementById("prefillError");

// Handoff key written by selectorPicker.js after a pick (kept in sync with its STORAGE_KEY).
const SELECTOR_STORAGE_KEY = "eesimple:pendingSelector";
const SELECTOR_TTL_MS = 15 * 60 * 1000;

let serverUrl = "";
let pageTitle = "";
let closeTimer = null;
let currentTab = null;
// The last fill-context fetched — the "Find a selector" flow reads website.{id,slug,extensionFillRules}
// and properties off it to create + deep-link the draft rule.
let currentCtx = null;
// Target specs backing the prefill `<select>` (parallel to its <option>s).
let prefillSpecs = [];

const SCREENS = {
  setup: setupEl,
  form: formEl,
  success: successEl,
  inboxSaved: inboxSavedEl,
  saved: savedStateEl,
  filling: fillFillingEl,
  review: fillReviewEl,
  applied: fillAppliedEl,
  selectorPrefill: selectorPrefillEl,
};

// Taxonomy match-or-create resolver + summary helpers, loaded from taxonomyFill.js (a classic
// script included before this one in popup.html). `TAX_PATCH_KEY` maps each taxonomy kind to its
// PATCH id-array field / stub endpoint.
const {
  TAX_PATCH_KEY,
  TAX_NOUN,
  TAXONOMY_ENTITY_PATCH,
  resolveTaxonomyId,
  resolveRelationId,
  resolveLanguageId,
  normalizeLanguageCode,
  summarizeCreated,
  summarizeFailed,
} = globalThis.eesimpleTaxonomyFill;
// Custom-property types the popup can fill, mapped to the bookmark's typed value array / PATCH key.
// itemInItems (Two Numbers) and choices fill a single rule-selected sub-value (target.subField /
// target.choiceValue). ratingScale fills a numeric value in numberValues; a range-enabled rating
// fills the rule-selected end (target.ratingBound: "from"|"to"), or — in detect mode
// (target.ratingBound: "range") — sets both ends from the min/max of the levels the engine detected
// present on the page. Other value kinds (sections/…) degrade to a disabled "unsupported" row.
const VALUE_PATCH_KEY = {
  number: "numberValues",
  boolean: "booleanValues",
  text: "textValues",
  datetime: "dateTimeValues",
  itemInItems: "progressValues",
  ratingScale: "numberValues",
  choices: "choicesValues",
};

function show(state) {
  for (const key of Object.keys(SCREENS)) {
    SCREENS[key].classList.toggle("hidden", key !== state);
  }
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function openBookmark(id) {
  if (id) {
    chrome.tabs.create({
      url: `${serverUrl}/bookmarks/${id}`,
    });
  }
  window.close();
}

// --- Boot ---------------------------------------------------------------
chrome.storage.local.get("serverUrl", ({
  serverUrl: stored,
}) => {
  if (!stored) {
    show("setup");
    urlInput.focus();
    return;
  }
  serverUrl = stripTrailingSlash(stored);
  initForm();
});

// --- Setup flow (first run) --------------------------------------------
saveBtn?.addEventListener("click", () => {
  const value = stripTrailingSlash(urlInput.value.trim());
  if (!value) {
    statusEl.textContent = "Please enter a URL.";
    return;
  }
  chrome.storage.local.set({
    serverUrl: value,
  }, () => {
    serverUrl = value;
    initForm();
  });
});

urlInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveBtn.click();
});

// --- Boot into the right mode ------------------------------------------
// Reads the active tab, then asks the server what to do with this URL:
//   unknown                 → auto-save to the Inbox (1 click = the icon), then offer
//                             "Move to Bookmarks" / "View Inbox"
//   inbox                   → "already in your inbox" + the same Move to Bookmarks affordance
//   bookmark + rules        → fill mode (scrape the page, review, apply)
//   bookmark + no rules      → "already saved"
//   fill-context fetch failure → the editable add form (never regress saving)
function initForm() {
  chrome.tabs.query({
    active: true,
    currentWindow: true,
  }, ([tab]) => {
    currentTab = tab;
    bmUrl.value = tab?.url ?? "";
    pageTitle = tab?.title ?? "";
    const url = (tab?.url ?? "").trim();
    if (!url) {
      // No usable URL — fall back to the editable add form for manual entry.
      show("form");
      bmUrl.focus();
      return;
    }
    void bootFillContext(url);
  });
}

// Fetch the fill-context and route. `autoSave` gates whether an `unknown` URL is auto-saved to the
// Inbox (true on the initial boot; false when re-routing after a 409 so we never re-POST in a loop).
async function bootFillContext(url, autoSave = true) {
  let ctx;
  try {
    const res = await fetch(
      `${serverUrl}/api/extension/fill-context?url=${encodeURIComponent(url)}`,
    );
    if (!res.ok) throw new Error(`status ${res.status}`);
    ctx = await res.json();
  }
  catch {
    // Fill-context unavailable (old server, network error) — never regress saving.
    quickSaveFallback();
    return;
  }
  currentCtx = ctx;
  // A selector picked on this page (by the injected picker) takes priority — finish creating its rule.
  const pending = await readPendingSelector(url);
  if (pending) {
    void showSelectorPrefill(ctx, pending);
    return;
  }
  routeByMode(ctx, url, autoSave);
}

// Show the editable add form with both choices (Add to Inbox / Add as Bookmark). Reached only when
// the fill-context/inbox call fails or there's no usable URL — the manual fallback. The URL is
// pre-filled from the active tab (initForm), so it's still one click either way.
function quickSaveFallback() {
  show("form");
}

function routeByMode(ctx, url, autoSave = true) {
  if (!ctx || ctx.mode === "unknown") {
    // First visit: auto-save to the Inbox so the common case is one click (the icon). After a 409
    // re-route we don't auto-save again — fall back to the form instead of looping.
    if (autoSave) void autoSaveToInbox(url);
    else quickSaveFallback();
    return;
  }
  if (ctx.mode === "inbox") {
    renderInboxSaved(ctx.inboxItemId, url, "Already in your inbox.");
    return;
  }
  if (ctx.mode === "taxonomy") {
    // The page is a taxonomy entity's source (no bookmark) — fill the entity directly. Keep only the
    // taxonomyDirect rules whose path gate matches. If that gates to nothing, don't leave the page
    // unsaved: fall back to the unknown behavior (auto-save to Inbox, or the manual form after a re-route).
    const rules = gateRules(ctx.website?.extensionFillRules ?? [], url)
      .filter(rule => rule.target?.kind === "taxonomyDirect");
    if (!ctx.website || rules.length === 0) {
      if (autoSave) void autoSaveToInbox(url);
      else quickSaveFallback();
      return;
    }
    void enterFillMode(ctx, rules);
    return;
  }
  if (ctx.mode === "bookmark") {
    const rules = gateRules(ctx.website?.extensionFillRules ?? [], url);
    if (!ctx.website || rules.length === 0) {
      renderSaved(ctx.bookmark);
      return;
    }
    void enterFillMode(ctx, rules);
    return;
  }
  // Unexpected mode — stay safe and fall back to the form.
  quickSaveFallback();
}

// Auto-save the current page to the Inbox on popup open (the `unknown` path). On success, show the
// inbox-saved screen with a Move to Bookmarks affordance; on 409 the URL is already saved/pending, so
// re-route (without auto-saving again) to land on the right screen.
async function autoSaveToInbox(url) {
  try {
    const res = await fetch(`${serverUrl}/api/bookmarks/inbox`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        title: pageTitle || url,
      }),
    });
    if (res.status === 201) {
      const data = await res.json().catch(() => ({}));
      renderInboxSaved(data && data.id, url, "Saved to Inbox.");
    }
    else if (res.status === 409) {
      // Already a bookmark or already pending — re-route from a fresh fill-context, no re-save.
      void bootFillContext(url, false);
    }
    else {
      // 400 (invalid URL) or an unexpected status — fall back to the editable form.
      quickSaveFallback();
    }
  }
  catch {
    // Server unreachable — fall back to the editable form (manual entry / retry).
    quickSaveFallback();
  }
}

// Inbox-saved screen: "View Inbox" is always available; "Move to Bookmarks" appears only when we
// know the pending import-item id (from the inbox POST response or fill-context's `inboxItemId`).
function renderInboxSaved(itemId, url, message) {
  inboxSavedMsg.textContent = message || "Saved to Inbox.";
  inboxSavedError.classList.add("hidden");
  inboxSavedError.textContent = "";
  inboxSavedViewBtn.onclick = () => {
    cancelCountdown();
    chrome.tabs.create({
      url: `${serverUrl}/inbox`,
    });
    window.close();
  };
  if (itemId) {
    moveToBookmarksBtn.classList.remove("hidden");
    moveToBookmarksBtn.disabled = false;
    moveToBookmarksBtn.textContent = "Move to Bookmarks";
    moveToBookmarksBtn.onclick = () => void moveToBookmarks(itemId, url);
    // Undo is only possible while we hold the pending import-item id.
    inboxUndoBtn.classList.remove("hidden");
    inboxUndoBtn.disabled = false;
    inboxUndoBtn.textContent = "Undo";
    inboxUndoBtn.onclick = () => void undoInboxSave(itemId);
  }
  else {
    moveToBookmarksBtn.classList.add("hidden");
    inboxUndoBtn.classList.add("hidden");
  }
  show("inboxSaved");
  startCountdown();
}

// Undo an Inbox save: reject the pending import item so it leaves the review queue. A 404 means it's
// already gone, which satisfies the same intent — treat it as success. Cancels the auto-close so the
// popup stays open through the round-trip.
async function undoInboxSave(itemId) {
  cancelCountdown();
  inboxSavedError.classList.add("hidden");
  inboxSavedError.textContent = "";
  inboxUndoBtn.disabled = true;
  inboxUndoBtn.textContent = "Undoing…";
  moveToBookmarksBtn.disabled = true;
  try {
    const res = await fetch(`${serverUrl}/api/imports/items/${itemId}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    if (!res.ok && res.status !== 404) throw new Error(`status ${res.status}`);
    inboxSavedMsg.textContent = "Removed from Inbox.";
    moveToBookmarksBtn.classList.add("hidden");
    inboxUndoBtn.classList.add("hidden");
    startCountdown();
  }
  catch {
    inboxUndoBtn.disabled = false;
    inboxUndoBtn.textContent = "Undo";
    moveToBookmarksBtn.disabled = false;
    inboxSavedError.textContent = "Couldn't undo. Please try again.";
    inboxSavedError.classList.remove("hidden");
  }
}

// Promote the pending inbox item to a real bookmark (consumes the item, no orphan), then flow into
// the shared post-create step (autofill fill mode if the site has rules, else the success screen).
async function moveToBookmarks(itemId, url) {
  cancelCountdown();
  inboxSavedError.classList.add("hidden");
  inboxSavedError.textContent = "";
  moveToBookmarksBtn.disabled = true;
  moveToBookmarksBtn.textContent = "Moving…";
  try {
    const res = await fetch(`${serverUrl}/api/imports/items/${itemId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json().catch(() => ({}));
    // approved | duplicate | skipped all carry a bookmarkId; error carries none.
    const bookmarkId = data && data.bookmarkId;
    if (!bookmarkId) throw new Error("no bookmark id");
    await afterBookmarkCreated(bookmarkId, url);
  }
  catch {
    moveToBookmarksBtn.disabled = false;
    moveToBookmarksBtn.textContent = "Move to Bookmarks";
    inboxSavedError.textContent = "Couldn't move to Bookmarks. Please try again.";
    inboxSavedError.classList.remove("hidden");
  }
}

// Shared step after a bookmark is created (Move to Bookmarks, or the fallback form's Add as
// Bookmark): re-check fill-context and, if the matched website has gated fill rules, flow straight
// into the autofill review UI in the same popup; otherwise show the bookmark success screen.
async function afterBookmarkCreated(bookmarkId, url) {
  let ctx;
  try {
    const res = await fetch(
      `${serverUrl}/api/extension/fill-context?url=${encodeURIComponent(url)}`,
    );
    if (!res.ok) throw new Error(`status ${res.status}`);
    ctx = await res.json();
  }
  catch {
    // Couldn't check for fill rules — just report the bookmark was created.
    onBookmarkSuccess("Added as bookmark.", bookmarkId);
    return;
  }
  if (ctx && ctx.mode === "bookmark") {
    const rules = gateRules(ctx.website?.extensionFillRules ?? [], url);
    if (ctx.website && rules.length > 0) {
      void enterFillMode(ctx, rules);
      return;
    }
  }
  onBookmarkSuccess("Added as bookmark.", bookmarkId);
}

// Evaluate a rule's optional path gate against the current pathname. Absent gate (or a blank
// value) = the rule always applies. An invalid regex never throws and never matches.
function pathMatches(pm, pathname) {
  if (!pm || !pm.value) return true;
  switch (pm.mode) {
    case "prefix":
      return pathname.startsWith(pm.value);
    case "suffix":
      return pathname.endsWith(pm.value);
    case "contains":
      return pathname.includes(pm.value);
    case "regex":
      try {
        return new RegExp(pm.value).test(pathname);
      }
      catch {
        return false;
      }
    default:
      return true;
  }
}

// A rule's effective path gate: the current `pathMatch`, or a legacy `pathSuffix` read as a suffix
// gate (older/un-migrated data — mirrors the server migration `pathSuffix → {mode:"suffix"}`). Absent
// on both = no gate = the rule applies to every path. Without this fallback a rule that still carries
// only `pathSuffix` reads as un-gated and leaks onto every path.
function ruleGate(rule) {
  if (rule.pathMatch) return rule.pathMatch;
  if (rule.pathSuffix) return {
    mode: "suffix",
    value: rule.pathSuffix,
  };
  return null;
}

// Keep only rules whose optional path gate matches the current path.
function gateRules(rules, url) {
  let pathname = "";
  try {
    pathname = new URL(url).pathname;
  }
  catch {
    pathname = "";
  }
  return rules.filter(rule => pathMatches(ruleGate(rule), pathname));
}

function renderSaved(bookmark) {
  savedOpenBtn.onclick = () => openBookmark(bookmark?.id);
  wireDescriptionEditor(DESCRIPTION_EDITORS.saved, bookmark);
  wireFindSelectorButton(findSelectorSavedBtn, findSelectorSavedStatus);
  wireCaptureButton(captureSavedBtn, captureSavedStatus, bookmark?.id);
  wireDeleteButton(deleteSavedBtn, deleteSavedStatus, bookmark?.id);
  show("saved");
}

// Description editors — one per bookmark-context screen (mirrors the per-screen capture/delete
// controls). Each lets the user edit the bookmark's description in place and PATCH it.
const DESCRIPTION_EDITORS = {
  saved: {
    field: savedDescription,
    btn: saveDescriptionBtn,
    status: saveDescriptionStatus,
  },
  review: {
    field: reviewDescription,
    btn: saveReviewDescriptionBtn,
    status: saveReviewDescriptionStatus,
  },
  applied: {
    field: appliedDescription,
    btn: saveAppliedDescriptionBtn,
    status: saveAppliedDescriptionStatus,
  },
};

// Prefill an editor with the bookmark's current description and wire Save. Only offer it when we know
// the bookmark id (needed for the PATCH); otherwise hide the controls (e.g. taxonomy mode).
function wireDescriptionEditor(editor, bookmark) {
  const hasBookmark = !!bookmark?.id;
  editor.field.classList.toggle("hidden", !hasBookmark);
  editor.btn.classList.toggle("hidden", !hasBookmark);
  editor.status.textContent = "";
  if (!hasBookmark) return;
  editor.field.value = bookmark.description ?? "";
  editor.btn.disabled = false;
  editor.btn.textContent = "Save description";
  editor.btn.onclick = () => void saveDescription(bookmark, editor);
}

// PATCH the bookmark's description. Keeps the popup open (cancel the auto-close) so the user can keep
// editing; reports success/failure inline without leaving the current screen.
async function saveDescription(bookmark, editor) {
  if (!bookmark?.id) return;
  cancelCountdown();
  editor.btn.disabled = true;
  editor.btn.textContent = "Saving…";
  editor.status.textContent = "";
  try {
    const res = await fetch(`${serverUrl}/api/bookmarks/${bookmark.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: editor.field.value,
      }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    // Keep the in-memory bookmark in sync so a re-save (or another screen's editor) sees the latest value.
    bookmark.description = editor.field.value;
    editor.btn.disabled = false;
    editor.btn.textContent = "Save description";
    editor.status.textContent = "Saved.";
  }
  catch {
    editor.btn.disabled = false;
    editor.btn.textContent = "Save description";
    editor.status.textContent = "Couldn't save. Please try again.";
  }
}

// --- "Find a selector" mode --------------------------------------------
// The button injects the in-page picker (selectorPicker.js) and closes the popup (an MV3 action
// popup dies the moment the page takes focus). The picker writes the chosen selector(s) to
// chrome.storage.local; the next popup open detects it (readPendingSelector) and lands on the
// prefill screen to create + deep-link the draft rule.

function escapeHtmlPopup(str) {
  return String(str ?? "").replace(/[&<>"]/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
  }[c]));
}

// Only offer the button when the website record is known (needed to save the rule + deep-link).
function wireFindSelectorButton(btn, statusEl) {
  if (!btn) return;
  const hasWebsite = !!(currentCtx?.website?.id && currentCtx?.website?.slug);
  btn.classList.toggle("hidden", !hasWebsite);
  if (statusEl) statusEl.textContent = "";
  btn.onclick = () => void startSelectorPicker(statusEl);
}

// Two-step injection twin of injectAndRun: load the picker (+ engine, for its value preview), then start it.
async function injectPicker(tabId) {
  await chrome.scripting.executeScript({
    target: {
      tabId,
    },
    files: ["fillEngine.js", "selectorPicker.js"],
  });
  await chrome.scripting.executeScript({
    target: {
      tabId,
    },
    func: () => globalThis.eesimpleSelectorPicker.start(),
  });
}

async function startSelectorPicker(statusEl) {
  if (currentTab?.id == null) return;
  try {
    await injectPicker(currentTab.id);
  }
  catch {
    // Restricted page (chrome://, the store, a PDF viewer, …) — can't inject.
    if (statusEl) statusEl.textContent = "Can't scan this page (a browser or store page).";
    return;
  }
  window.close();
}

function readPendingSelector(url) {
  return new Promise((resolve) => {
    if (!chrome.storage?.local) {
      resolve(null);
      return;
    }
    chrome.storage.local.get(SELECTOR_STORAGE_KEY, (data) => {
      const pending = data?.[SELECTOR_STORAGE_KEY];
      if (!pending || !pending.selector) {
        resolve(null);
        return;
      }
      if (Date.now() - (pending.ts || 0) > SELECTOR_TTL_MS || !sameUrlIsh(pending.url, url)) {
        resolve(null);
        return;
      }
      resolve(pending);
    });
  });
}

function clearPendingSelector() {
  return new Promise((resolve) => {
    if (!chrome.storage?.local) {
      resolve();
      return;
    }
    chrome.storage.local.remove(SELECTOR_STORAGE_KEY, () => resolve());
  });
}

// Compare origin+path only — the picked-page URL may carry a different hash/query than the tab URL.
function sameUrlIsh(a, b) {
  if (!a || !b) return false;
  const strip = (u) => {
    try {
      const parsed = new URL(u);
      return parsed.origin + parsed.pathname;
    }
    catch {
      return String(u).split("#")[0];
    }
  };
  return strip(a) === strip(b);
}

async function showSelectorPrefill(ctx, pending) {
  prefillError.textContent = "";
  const website = ctx.website;
  if (!website?.id || !website?.slug) {
    // No website record to attach a rule to — drop the pick and route normally.
    await clearPendingSelector();
    routeByMode(ctx, pending.url, false);
    return;
  }
  prefillLabel.value = pending.label || "New rule";
  buildPrefillSummary(pending);
  prefillEntryType.classList.toggle("hidden", pending.mode !== "section");

  prefillSpecs = await buildPrefillTargets(ctx, pending);
  prefillTarget.innerHTML = "";
  prefillSpecs.forEach((spec) => {
    const opt = document.createElement("option");
    opt.value = spec.value;
    opt.textContent = spec.label;
    prefillTarget.appendChild(opt);
  });
  const empty = prefillSpecs.length === 0;
  prefillTarget.disabled = empty;
  prefillCreateBtn.disabled = empty;
  if (empty) {
    prefillError.textContent = pending.mode === "section"
      ? "Couldn't find the Sections property on the server."
      : "No target field was available.";
  }

  prefillCreateBtn.onclick = () => void createDraftRuleAndOpenEditor(ctx, pending);
  prefillDiscardBtn.onclick = () => void discardPrefill(ctx, pending);
  show("selectorPrefill");
}

function buildPrefillSummary(pending) {
  const rows = [];
  const row = (label, value) =>
    `<div><span class="fill-label">${label}:</span> <code>${escapeHtmlPopup(value)}</code></div>`;
  if (pending.mode === "section") {
    const s = pending.section || {};
    rows.push(row("Item", s.itemSelector));
    if (s.itemName) rows.push(row("Name", s.itemName));
    if (s.itemUrl) rows.push(row("Link", s.itemUrl));
    if (s.sectionHeaderSelector) rows.push(row("Header", s.sectionHeaderSelector));
  }
  else {
    rows.push(row("Selector", pending.selector));
    if (pending.mode === "list") {
      rows.push(`<div class="fill-note">Matches ${pending.matchCount ?? "?"} elements</div>`);
    }
    if (pending.sampleValue) rows.push(`<div class="fill-note">Sample: ${escapeHtmlPopup(pending.sampleValue)}</div>`);
  }
  prefillSummary.innerHTML = rows.join("");
}

// The target `<select>` specs. A `sections` result needs the built-in Sections property id (fetched,
// since it isn't in ctx.properties unless a sections rule already exists); scalar/list results offer
// the four `field` targets plus one `customProperty` per referenced property.
async function buildPrefillTargets(ctx, pending) {
  if (pending.mode === "section") {
    const propertyId = await resolveSectionsPropertyId();
    return propertyId
      ? [{
        value: "sections",
        label: "Sections property",
        kind: "sections",
        propertyId,
      }]
      : [];
  }
  const specs = [
    {
      value: "field:title",
      label: "Field: Title",
      kind: "field",
      field: "title",
    },
    {
      value: "field:description",
      label: "Field: Description",
      kind: "field",
      field: "description",
    },
    {
      value: "field:isbn",
      label: "Field: ISBN",
      kind: "field",
      field: "isbn",
    },
    {
      value: "field:year",
      label: "Field: Year",
      kind: "field",
      field: "year",
    },
  ];
  (ctx.properties || []).forEach((prop) => {
    specs.push({
      value: `prop:${prop.id}`,
      label: `Property: ${prop.name}`,
      kind: "customProperty",
      propertyId: prop.id,
    });
  });
  return specs;
}

async function resolveSectionsPropertyId() {
  try {
    const res = await fetch(`${serverUrl}/api/custom-properties`);
    if (!res.ok) return null;
    const props = await res.json();
    const sections = (props || []).find(prop => prop.slug === "sections");
    return sections ? sections.id : null;
  }
  catch {
    return null;
  }
}

// Build a schema-clean draft rule (only fields fillTargetSchema allows — additionalProperties:false).
function buildDraftRule(pending, label, spec) {
  const id = randomId();
  if (spec.kind === "sections") {
    const s = pending.section || {};
    const target = {
      kind: "sections",
      propertyId: spec.propertyId,
      entryType: prefillEntryType.value || "name",
    };
    if (s.container) target.container = s.container;
    if (s.itemName) target.itemName = s.itemName;
    if (s.itemUrl) {
      target.itemUrl = s.itemUrl;
      target.resolveItemUrl = true;
    }
    if (s.sectionHeaderSelector) target.sectionHeaderSelector = s.sectionHeaderSelector;
    return {
      id,
      label,
      target,
      extract: {
        selector: s.itemSelector || pending.selector,
      },
    };
  }
  const target = spec.kind === "field"
    ? {
      kind: "field",
      field: spec.field,
    }
    : {
      kind: "customProperty",
      propertyId: spec.propertyId,
    };
  const extract = {
    selector: pending.selector,
  };
  if (pending.read?.kind && pending.read.kind !== "text") extract.read = pending.read;
  return {
    id,
    label,
    target,
    extract,
  };
}

async function createDraftRuleAndOpenEditor(ctx, pending) {
  prefillError.textContent = "";
  const spec = prefillSpecs.find(s => s.value === prefillTarget.value);
  if (!spec) {
    prefillError.textContent = "Pick where to put the value.";
    return;
  }
  const label = prefillLabel.value.trim() || "New rule";
  const rule = buildDraftRule(pending, label, spec);
  const website = ctx.website;
  const rules = [...(website.extensionFillRules || []), rule];
  prefillCreateBtn.disabled = true;
  prefillCreateBtn.textContent = "Creating…";
  try {
    const res = await fetch(`${serverUrl}/api/websites/${website.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        extensionFillRules: rules,
      }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
  }
  catch (err) {
    prefillCreateBtn.disabled = false;
    prefillCreateBtn.textContent = "Create draft rule & open editor";
    prefillError.textContent = `Couldn't save the rule (${err?.message ?? err}).`;
    return;
  }
  await clearPendingSelector();
  chrome.tabs.create({
    url: `${serverUrl}/taxonomies/websites/${website.slug}/edit?tab=extension-fill&rule=${rule.id}`,
  });
  window.close();
}

async function discardPrefill(ctx, pending) {
  await clearPendingSelector();
  routeByMode(ctx, pending.url, false);
}

// --- Add form: quick-save-to-inbox or add-as-bookmark ------------------
function resetAdd() {
  addBtn.disabled = false;
  addBtn.textContent = "Add to Inbox";
  addBookmarkBtn.disabled = false;
  addBookmarkBtn.textContent = "Add as Bookmark";
}

// Shared error handling for a non-2xx add response. Returns true if it handled the status.
function handleAddError(status) {
  if (status === 400) {
    resetAdd();
    formError.textContent = "That doesn't look like a valid URL.";
    return true;
  }
  resetAdd();
  formError.textContent = `Error saving (${status}).`;
  return true;
}

async function submit() {
  const url = bmUrl.value.trim();
  formError.textContent = "";
  if (!url) {
    formError.textContent = "Please enter a URL.";
    return;
  }

  addBtn.disabled = true;
  addBtn.textContent = "Adding…";
  addBookmarkBtn.disabled = true;
  try {
    const res = await fetch(`${serverUrl}/api/bookmarks/inbox`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        title: pageTitle || url,
      }),
    });
    if (res.status === 201) {
      // Land on the inbox-saved screen (Move to Bookmarks + Undo) — capture the pending item id.
      const data = await res.json().catch(() => ({}));
      renderInboxSaved(data && data.id, url, "Queued in Inbox.");
    }
    else if (res.status === 409) {
      onSuccess("Already saved.", true);
    }
    else {
      handleAddError(res.status);
    }
  }
  catch {
    resetAdd();
    formError.textContent = "Could not reach the eeSimple server.";
  }
}

// Add-as-bookmark: bypass the Inbox and create a full bookmark directly (autofill + defaults +
// image capture applied server-side, same as approving an Inbox item).
async function submitBookmark() {
  const url = bmUrl.value.trim();
  formError.textContent = "";
  if (!url) {
    formError.textContent = "Please enter a URL.";
    return;
  }

  addBookmarkBtn.disabled = true;
  addBookmarkBtn.textContent = "Adding…";
  addBtn.disabled = true;
  try {
    const res = await fetch(`${serverUrl}/api/bookmarks/quick-add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        title: pageTitle || url,
      }),
    });
    if (res.status === 201) {
      const data = await res.json().catch(() => ({}));
      // Flow into fill mode when the site has rules — same as Move to Bookmarks — so the user
      // doesn't have to reopen the popup to autofill.
      await afterBookmarkCreated(data && data.id, url);
    }
    else if (res.status === 409) {
      onSuccess("Already saved.", true);
    }
    else {
      handleAddError(res.status);
    }
  }
  catch {
    resetAdd();
    formError.textContent = "Could not reach the eeSimple server.";
  }
}

addBtn?.addEventListener("click", submit);
addBookmarkBtn?.addEventListener("click", submitBookmark);
bmUrl?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submit();
});

// --- Success + countdown ------------------------------------------------
function onSuccess(message, hideViewInbox = false) {
  successMsg.textContent = message;
  if (hideViewInbox) {
    viewInboxBtn.classList.add("hidden");
  }
  else {
    viewInboxBtn.classList.remove("hidden");
    viewInboxBtn.textContent = "View Inbox";
    viewInboxBtn.onclick = () => {
      cancelCountdown();
      chrome.tabs.create({
        url: `${serverUrl}/inbox`,
      });
      window.close();
    };
  }
  // Inbox-only success has no bookmark to attach a screenshot to or delete.
  wireCaptureButton(captureSuccessBtn, captureSuccessStatus, null);
  wireDeleteButton(deleteSuccessBtn, deleteSuccessStatus, null);
  show("success");
  startCountdown();
}

// Success screen for the add-as-bookmark flow: relabels the action button to open the new bookmark.
function onBookmarkSuccess(message, bookmarkId) {
  successMsg.textContent = message;
  viewInboxBtn.classList.remove("hidden");
  viewInboxBtn.textContent = "Open Bookmark";
  viewInboxBtn.onclick = () => {
    cancelCountdown();
    openBookmark(bookmarkId);
  };
  wireCaptureButton(captureSuccessBtn, captureSuccessStatus, bookmarkId);
  wireDeleteButton(deleteSuccessBtn, deleteSuccessStatus, bookmarkId);
  show("success");
  startCountdown();
}

function startCountdown() {
  progressEl.classList.remove("hidden");
  // restart the CSS animation cleanly (force a reflow before re-adding the class)
  progressBar.classList.remove("run");
  void progressBar.offsetWidth;
  progressBar.classList.add("run");
  closeTimer = setTimeout(() => window.close(), AUTO_CLOSE_MS);
}

function cancelCountdown() {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  progressBar.classList.remove("run");
  progressEl.classList.add("hidden");
}

// --- Screenshot capture -------------------------------------------------
// Reset a screen's "Capture screenshot" button and wire it to the bookmark. Hidden when there's no
// bookmark to attach to (e.g. the inbox-only success screen). Shown wherever a bookmark id exists.
function wireCaptureButton(btn, statusEl, bookmarkId) {
  if (!btn) return;
  if (statusEl) statusEl.textContent = "";
  if (!bookmarkId) {
    btn.classList.add("hidden");
    return;
  }
  btn.classList.remove("hidden");
  btn.disabled = false;
  btn.textContent = "Capture screenshot";
  btn.onclick = () => void captureScreenshot(bookmarkId, btn, statusEl);
}

// Capture the visible tab and store it in the bookmark's screenshot slot. Client-side capture works
// on pages behind a login that the server-side (Browserless) capture can't reach. Cancels the
// auto-close countdown so the popup stays open while capturing. Best-effort: reports status inline
// and never throws.
async function captureScreenshot(bookmarkId, btn, statusEl) {
  if (!bookmarkId) return;
  cancelCountdown();
  btn.disabled = true;
  btn.textContent = "Capturing…";
  if (statusEl) statusEl.textContent = "";
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(currentTab?.windowId, {
      format: "jpeg",
      quality: 92,
    });
    const blob = await (await fetch(dataUrl)).blob();
    if (!blob || blob.size === 0) throw new Error("empty capture");
    const form = new FormData();
    form.append("file", blob, "screenshot.jpg");
    const res = await fetch(`${serverUrl}/api/bookmarks/${bookmarkId}/screenshot/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    btn.textContent = "Screenshot saved";
  }
  catch {
    btn.disabled = false;
    btn.textContent = "Capture screenshot";
    if (statusEl) statusEl.textContent = "Couldn't capture the screenshot. Please try again.";
  }
}

// --- Delete bookmark ----------------------------------------------------
// Reset a screen's "Delete bookmark" button and wire it to the bookmark. Hidden when there's no
// bookmark (e.g. taxonomy-only fill mode). Deletion is permanent, so the button confirms inline: the
// first click arms a "Click again to delete" state that auto-reverts after 3s; the second click deletes.
function wireDeleteButton(btn, statusEl, bookmarkId) {
  if (!btn) return;
  if (statusEl) statusEl.textContent = "";
  if (!bookmarkId) {
    btn.classList.add("hidden");
    return;
  }
  btn.classList.remove("hidden");
  btn.disabled = false;
  btn.classList.remove("confirming");
  btn.textContent = "Delete bookmark";
  let revertTimer = null;
  const reset = () => {
    if (revertTimer) {
      clearTimeout(revertTimer);
      revertTimer = null;
    }
    btn.classList.remove("confirming");
    btn.textContent = "Delete bookmark";
  };
  btn.onclick = () => {
    if (btn.classList.contains("confirming")) {
      reset();
      void deleteBookmark(bookmarkId, btn, statusEl);
      return;
    }
    // First click: arm confirmation. Keep the popup open while the user decides.
    cancelCountdown();
    if (statusEl) statusEl.textContent = "";
    btn.classList.add("confirming");
    btn.textContent = "Click again to delete";
    revertTimer = setTimeout(reset, 3000);
  };
}

// Permanently delete the bookmark, then close the popup. A 404 means it's already gone — same intent,
// treat it as success. On failure, re-arm the button and report inline.
async function deleteBookmark(bookmarkId, btn, statusEl) {
  if (!bookmarkId) return;
  cancelCountdown();
  btn.disabled = true;
  btn.textContent = "Deleting…";
  if (statusEl) statusEl.textContent = "";
  try {
    const res = await fetch(`${serverUrl}/api/bookmarks/${bookmarkId}`, {
      method: "DELETE",
    });
    if (!res.ok && res.status !== 404) throw new Error(`status ${res.status}`);
    btn.textContent = "Deleted";
    setTimeout(() => window.close(), 800);
  }
  catch {
    btn.disabled = false;
    btn.classList.remove("confirming");
    btn.textContent = "Delete bookmark";
    if (statusEl) statusEl.textContent = "Couldn't delete. Please try again.";
  }
}

// --- Fill mode ----------------------------------------------------------
async function enterFillMode(ctx, rules) {
  // In `taxonomy` mode there's no bookmark — fall back to the tab title and the website name so the
  // "filling" / review screens still have a heading.
  const bookmark = ctx.bookmark;
  fillFillingTitle.textContent = bookmark?.title ?? currentTab?.title ?? ctx.website?.siteName ?? "";
  show("filling");

  let results;
  try {
    results = await injectAndRun(currentTab?.id, rules);
  }
  catch {
    // Restricted page (chrome://, the extension gallery, a PDF viewer, …) — can't inject.
    // Keep the bookmark facts visible and show an inline error instead of rows.
    showReviewError(
      bookmark,
      "Couldn't read this page — it may be a browser page that extensions can't access.",
    );
    return;
  }

  let rows;
  try {
    rows = rules.map((rule) => {
      const result = results.find(r => r.ruleId === rule.id);
      return buildRow(rule, result, ctx);
    });
  }
  catch {
    // A malformed rule/result shouldn't leave the popup stuck on the "Reading the page…" spinner.
    showReviewError(bookmark, "Couldn't prepare the changes for this page.");
    return;
  }
  renderReview(bookmark, rows, ctx.website?.extensionFillRuleGroups ?? []);
}

// Two-step injection: load the classic engine script into the page, then call it with the rules.
async function injectAndRun(tabId, rules) {
  if (tabId == null) throw new Error("no tab");
  await chrome.scripting.executeScript({
    target: {
      tabId,
    },
    files: ["fillEngine.js"],
  });
  const injected = await chrome.scripting.executeScript({
    target: {
      tabId,
    },
    func: r => globalThis.eesimpleFillEngine.runRules(r),
    args: [rules],
  });
  return injected?.[0]?.result ?? [];
}

function showReviewError(bookmark, message) {
  fillReviewTitle.textContent = bookmark?.title ?? currentTab?.title ?? "";
  fillError.textContent = message;
  fillError.classList.remove("hidden");
  fillRows.innerHTML = "";
  fillApplyBtn.classList.add("hidden");
  // No bookmark (taxonomy mode) → nothing to open.
  fillReviewOpenBtn.classList.toggle("hidden", !bookmark);
  fillReviewOpenBtn.onclick = () => openBookmark(bookmark?.id);
  // A screenshot can still be taken even when the changes couldn't be prepared.
  wireDescriptionEditor(DESCRIPTION_EDITORS.review, bookmark);
  wireCaptureButton(captureReviewBtn, captureReviewStatus, bookmark?.id);
  show("review");
}

// --- Per-target diff row builders --------------------------------------
function baseRow(rule, currentText, extractedText, changed, disabledReason) {
  return {
    rule,
    label: rule.label || "(unnamed)",
    currentText,
    extractedText,
    extractedNames: null,
    newNames: [],
    changed: !!changed,
    disabledReason: disabledReason ?? null,
    apply: () => {
      // No-op default; disabled rows contribute nothing to the patch. Real rows override this.
    },
    checkbox: null,
  };
}

function buildRow(rule, result, ctx) {
  const kind = rule.target?.kind;
  const values = result?.values ?? [];
  if (kind === "field") return buildFieldRow(rule, values, ctx.bookmark);
  if (kind === "customProperty") return buildPropertyRow(rule, values, ctx);
  if (kind === "taxonomy") return buildTaxonomyRow(rule, values, ctx);
  if (kind === "image") return buildImageRow(rule, values, ctx.bookmark);
  if (kind === "taxonomyEntity") return buildTaxonomyEntityRow(rule, values, ctx);
  if (kind === "taxonomyDirect") return buildTaxonomyDirectRow(rule, result, ctx);
  if (kind === "sections") return buildSectionsRow(rule, result, ctx);
  return baseRow(rule, "", values[0] ?? "", false, "unsupported");
}

// Deep content comparison of two section-entry lists, IGNORING `id` (regenerated on every scrape) so a
// re-scrape of unchanged sections doesn't read as "changed". Compares name/type/startValue/endValue/url
// and recurses into children (absent vs empty treated as equal).
function sectionsContentEqual(a, b) {
  const ea = Array.isArray(a) ? a : [];
  const eb = Array.isArray(b) ? b : [];
  if (ea.length !== eb.length) return false;
  return ea.every((x, i) => {
    const y = eb[i];
    return (x.name || "") === (y.name || "")
      && x.type === y.type
      && (x.startValue || "") === (y.startValue || "")
      && (x.endValue || "") === (y.endValue || "")
      && (x.url || "") === (y.url || "")
      && sectionsContentEqual(x.children, y.children);
  });
}

// sections: assemble a BookmarkSectionsValue from the engine's structured `entries` (flat or two-tier).
// Ids are assigned here (the injected engine can't rely on a secure crypto in every page context). On
// apply the value is seeded/merged into the bookmark's sectionsValues, replacing this property's entry.
function buildSectionsRow(rule, result, ctx) {
  const bookmark = ctx.bookmark;
  const property = (ctx.properties ?? []).find(p => p.id === rule.target.propertyId);
  if (!property || property.type !== "sections") {
    return baseRow(rule, "", "", false, "unsupported");
  }
  const existing = (bookmark.sectionsValues ?? []).find(v => v.propertyId === property.id);
  // Re-fills must not wipe read progress: carry the stored entries' `completed` flags onto the
  // freshly-extracted list (paired by name, the same key diffSections uses).
  const entries = carrySectionCompletion(
    assignSectionIds(result?.entries ?? []),
    existing ? existing.sections : [],
  );
  const currentText = existing ? summarizeSections(existing.sections) : "—";
  if (entries.length === 0) {
    return baseRow(rule, currentText, "", false, "not found");
  }
  // Only flag as changed when the extracted content actually differs from the stored value (id-insensitive).
  const changed = !existing || !sectionsContentEqual(entries, existing.sections);
  const row = baseRow(rule, currentText, summarizeSections(entries), changed, changed ? null : "no change");
  // A per-section diff (added/removed/changed by name) for the review UI; renderRow shows it in place of
  // the coarse "N sections → N sections" text when the row is changed.
  row.sectionsDiff = diffSections(existing ? existing.sections : [], entries);
  row.apply = (patch, state) => {
    const map = seedValueMap(state, "sectionsValues", bookmark);
    map.set(property.id, {
      propertyId: property.id,
      // A rule can declare its scraped list exhaustive (enables sections-derived Progress); otherwise
      // preserve the stored flag (false for a first fill).
      exhaustive: rule.target.exhaustive === true ? true : (existing ? existing.exhaustive : false),
      sections: entries,
    });
  };
  return row;
}

// Build one persisted entry from an extracted one: a fresh id plus the content fields, carrying the
// optional endValue/url/completed only when present (so blanks stay out of the stored jsonb).
function sectionEntryWithId(entry) {
  const out = {
    id: randomId(),
    name: entry.name ?? "",
    type: entry.type,
    startValue: entry.startValue ?? "",
  };
  if (entry.endValue != null && entry.endValue !== "") out.endValue = entry.endValue;
  if (entry.url != null && entry.url !== "") out.url = entry.url;
  if (entry.completed === true) out.completed = true;
  return out;
}

// Assign a fresh id to each entry and child (depth 2), preserving the extracted content fields
// (name/type/startValue/endValue/url).
function assignSectionIds(entries) {
  return entries.map((entry) => {
    const out = sectionEntryWithId(entry);
    if (Array.isArray(entry.children)) {
      out.children = entry.children.map(sectionEntryWithId);
    }
    return out;
  });
}

// Carry the stored list's `completed` flags onto a freshly-extracted list so a re-fill doesn't wipe
// read progress. Entries pair by normalized name (a per-name queue, like diffSections, so a name
// matches at most once); a matched section's children pair the same way within it. Mutates and
// returns `entries`. `completed` never affects sectionsContentEqual, so carrying it over can't flip
// a row to "changed".
function carrySectionCompletion(entries, storedSections) {
  const stored = Array.isArray(storedSections) ? storedSections : [];
  if (stored.length === 0) return entries;
  const norm = s => (s.name || "").trim().toLowerCase();
  const pool = new Map();
  stored.forEach((s) => {
    const key = norm(s);
    if (!pool.has(key)) pool.set(key, []);
    pool.get(key).push(s);
  });
  for (const entry of entries) {
    const queue = pool.get(norm(entry));
    const match = queue && queue.length ? queue.shift() : null;
    if (!match) continue;
    if (match.completed === true) entry.completed = true;
    if (Array.isArray(entry.children) && Array.isArray(match.children)) {
      carrySectionCompletion(entry.children, match.children);
    }
  }
  return entries;
}

// "N sections, M items" (M = total children across the list; omitted when there are none).
function summarizeSections(sections) {
  const count = sections.length;
  const items = sections.reduce((sum, s) => sum + (s.children ? s.children.length : 0), 0);
  const base = `${count} section${count === 1 ? "" : "s"}`;
  return items > 0 ? `${base}, ${items} item${items === 1 ? "" : "s"}` : base;
}

// Render a timestamp's integer seconds as a clock (`m:ss`, or `h:mm:ss` past an hour). Mirrors the
// web app's formatSeconds (lib/propertyFormat.ts). A non-numeric value is returned unchanged.
function formatSectionSeconds(value) {
  const total = Number(value);
  if (!Number.isFinite(total)) return value;
  const secs = Math.max(0, Math.floor(total));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = n => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// A section entry's positional range as text — "start–end" (or just "start"), timestamps as clocks.
// Mirrors formatSectionValue/sectionEntryPositional: `type: "url"` has no positional value (its value
// is the link), so it returns "".
function formatSectionRange(entry) {
  if (entry.type === "url") return "";
  const display = v => (entry.type === "timestamp" ? formatSectionSeconds(v) : v);
  const start = display(entry.startValue || "");
  if (entry.endValue != null && entry.endValue !== "") return `${start}–${display(entry.endValue)}`;
  return start;
}

// A one-line label for a section: its name plus its range in parens when present, e.g.
// "Chapter 1 (1–20)" / "Intro (0:00–5:30)" / just "Preface" when there's no range.
function sectionLineLabel(entry) {
  const name = (entry.name || "").trim() || "(unnamed)";
  const range = formatSectionRange(entry);
  return range ? `${name} (${range})` : name;
}

// Content-level diff of two top-level section lists for display. Ids are regenerated on every scrape,
// so sections are paired by normalized name (trimmed, lower-cased), consumed greedily so duplicate
// names pair 1:1. Returns ordered items { kind, name, oldLabel?, newLabel?, oldChildren?, newChildren? }
// where kind is "changed" | "added" | "removed" | "unchanged". Emitted order: changed, added, removed,
// then the unchanged ones (collapsed to a count by the renderer). Child items are summarized as counts,
// not diffed recursively.
function diffSections(current, extracted) {
  const cur = Array.isArray(current) ? current : [];
  const ext = Array.isArray(extracted) ? extracted : [];
  const norm = s => (s.name || "").trim().toLowerCase();

  // Per-name queue of current sections, so an extracted section matches at most one current section.
  const pool = new Map();
  cur.forEach((s) => {
    const key = norm(s);
    if (!pool.has(key)) pool.set(key, []);
    pool.get(key).push(s);
  });

  const changed = [];
  const added = [];
  let unchanged = 0;
  for (const e of ext) {
    const queue = pool.get(norm(e));
    const match = queue && queue.length ? queue.shift() : null;
    if (!match) {
      added.push({
        kind: "added",
        name: e.name || "",
        newLabel: sectionLineLabel(e),
      });
    }
    else if (sectionsContentEqual([e], [match])) {
      unchanged += 1;
    }
    else {
      changed.push({
        kind: "changed",
        name: e.name || match.name || "",
        oldLabel: sectionLineLabel(match),
        newLabel: sectionLineLabel(e),
        oldChildren: match.children ? match.children.length : 0,
        newChildren: e.children ? e.children.length : 0,
      });
    }
  }

  // Anything left in the pool was in current but not extracted → removed.
  const removed = [];
  for (const queue of pool.values()) {
    for (const s of queue) removed.push({
      kind: "removed",
      name: s.name || "",
      oldLabel: sectionLineLabel(s),
    });
  }

  const items = [...changed, ...added, ...removed];
  if (unchanged > 0) items.push({
    kind: "unchanged",
    count: unchanged,
  });
  return items;
}

// A stable id for a new section entry. Prefers crypto.randomUUID, falling back for older page contexts.
function randomId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// image: grab image URL(s) off the page (resolved to absolute against the tab URL) and, on apply,
// download the bytes in the browser and upload them to the bookmark. `setMain` makes the first
// grabbed image the bookmark's main image. http(s) URLs and inline data:image/svg+xml URIs are
// accepted (SVG logos are commonly inlined); other non-http(s) values are dropped.
function buildImageRow(rule, values, bookmark) {
  const urls = values
    .map(resolveImageUrl)
    .filter(url => url !== null);
  const mainImage = (bookmark.images ?? []).find(img => img.isMain) ?? (bookmark.images ?? [])[0];
  const currentText = mainImage ? "1 image" : "—";
  if (!urls.length) {
    return baseRow(rule, currentText, "", false, "not found");
  }
  const setMain = !!rule.target.setMain;
  const extractedText = setMain ? `${urls.length} image → main` : `${urls.length} image`;
  const row = baseRow(rule, currentText, extractedText, true, null);
  // Uploads run in a separate phase after the PATCH — see applyChanges.
  row.image = {
    urls,
    setMain,
  };
  return row;
}

// Resolve an extracted value to a usable image URL: an absolute http(s) URL against the current
// tab, or an inline data:image/svg+xml URI (returned verbatim — the browser fetch in
// uploadImageFromUrl reads its bytes directly). Returns null for anything else.
function resolveImageUrl(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (/^data:image\/svg\+xml[;,]/i.test(trimmed)) return trimmed;
  try {
    const resolved = new URL(value, currentTab?.url ?? undefined);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return null;
    return resolved.href;
  }
  catch {
    return null;
  }
}

function buildFieldRow(rule, values, bookmark) {
  const field = rule.target.field;
  const extracted = values[0] ?? "";
  const current = bookmark ? bookmark[field] : undefined;
  if (!extracted) {
    return baseRow(rule, formatScalar(current), "", false, "not found");
  }
  if (field === "year") {
    const num = Number(extracted);
    if (!Number.isFinite(num)) {
      return baseRow(rule, formatScalar(current), extracted, false, "not found");
    }
    const changed = current !== num;
    const row = baseRow(rule, formatScalar(current), String(num), changed, changed ? null : "no change");
    row.apply = (patch) => {
      patch[field] = num;
    };
    return row;
  }
  const changed = (current ?? "") !== extracted;
  const row = baseRow(rule, formatScalar(current), extracted, changed, changed ? null : "no change");
  row.apply = (patch) => {
    patch[field] = extracted;
  };
  return row;
}

function buildPropertyRow(rule, values, ctx) {
  const bookmark = ctx.bookmark;
  const property = (ctx.properties ?? []).find(p => p.id === rule.target.propertyId);
  const patchKey = property ? VALUE_PATCH_KEY[property.type] : undefined;
  if (!property || !patchKey) {
    return baseRow(rule, "", values[0] ?? "", false, "unsupported");
  }
  // Rating "detect range" consumes the full values list (the present levels) — handled before the
  // single-value `extracted` collapse so an empty (no levels present) result is a clean "not found".
  if (property.type === "ratingScale" && rule.target.ratingBound === "range") {
    return buildRatingRangeRow(rule, property, values, bookmark);
  }
  const extracted = values[0] ?? "";
  if (!extracted) {
    return baseRow(rule, "", "", false, "not found");
  }
  if (property.type === "itemInItems") {
    return buildProgressRow(rule, property, extracted, bookmark);
  }
  if (property.type === "ratingScale") {
    return buildRatingRow(rule, property, extracted, bookmark);
  }
  if (property.type === "choices") {
    return buildChoicesRow(rule, property, extracted, bookmark);
  }
  const currentEntry = (bookmark[patchKey] ?? []).find(v => v.propertyId === property.id);
  const currentVal = currentEntry ? currentEntry.value : undefined;

  let coerced;
  let changed;
  let currentText;
  let extractedText;
  if (property.type === "number") {
    const num = Number(extracted);
    if (!Number.isFinite(num)) {
      return baseRow(rule, formatScalar(currentVal), extracted, false, "not found");
    }
    coerced = num;
    changed = currentVal !== num;
    currentText = formatScalar(currentVal);
    extractedText = String(num);
  }
  else if (property.type === "boolean") {
    const bool = coerceBoolean(extracted);
    if (bool === null) {
      return baseRow(rule, formatBoolean(currentVal), extracted, false, "not found");
    }
    coerced = bool;
    changed = currentVal !== bool;
    currentText = formatBoolean(currentVal);
    extractedText = formatBoolean(bool);
  }
  else {
    // text | datetime — stored as a plain string value
    coerced = extracted;
    changed = (currentVal ?? "") !== extracted;
    currentText = formatScalar(currentVal);
    extractedText = extracted;
  }

  const row = baseRow(rule, currentText, extractedText, changed, changed ? null : "no change");
  row.apply = (patch, state) => {
    if (!state.values[patchKey]) {
      state.values[patchKey] = new Map();
      for (const v of (bookmark[patchKey] ?? [])) {
        state.values[patchKey].set(v.propertyId, {
          ...v,
        });
      }
    }
    state.values[patchKey].set(property.id, {
      propertyId: property.id,
      value: coerced,
    });
  };
  return row;
}

// Seed a per-property value Map from the bookmark's existing entries so sibling values aren't wiped.
function seedValueMap(state, patchKey, bookmark) {
  if (!state.values[patchKey]) {
    state.values[patchKey] = new Map();
    for (const v of (bookmark[patchKey] ?? [])) {
      state.values[patchKey].set(v.propertyId, {
        ...v,
      });
    }
  }
  return state.values[patchKey];
}

// itemInItems (Two Numbers): fill only the rule-selected sub-number (current|total), preserving the
// sibling number from the existing value.
function buildProgressRow(rule, property, extracted, bookmark) {
  const subField = rule.target.subField === "total" ? "total" : "current";
  const num = Number(extracted);
  const existing = (bookmark.progressValues ?? []).find(v => v.propertyId === property.id);
  if (!Number.isFinite(num)) {
    return baseRow(rule, formatScalar(existing ? existing[subField] : undefined), extracted, false, "not found");
  }
  const currentVal = existing ? existing[subField] : undefined;
  const changed = currentVal !== num;
  const label = subField === "current" ? "current" : "total";
  const row = baseRow(
    rule,
    `${label}: ${formatScalar(currentVal)}`,
    `${label}: ${num}`,
    changed,
    changed ? null : "no change",
  );
  row.apply = (patch, state) => {
    const map = seedValueMap(state, "progressValues", bookmark);
    const entry = map.get(property.id) ?? {
      propertyId: property.id,
      current: 0,
      total: 0,
    };
    entry[subField] = num;
    map.set(property.id, entry);
  };
  return row;
}

// The per-number label for a rating level, or the number itself when unlabeled.
function ratingLabelFor(property, level) {
  const labels = property.ratingLabels;
  const label = labels ? labels[String(level)] : undefined;
  return label && String(label).trim() !== "" ? label : String(level);
}

// ratingScale: fill a numeric value in numberValues. A range-enabled rating fills only the
// rule-selected end (target.ratingBound: "from"|"to"), seeding the sibling from the existing value
// and keeping value <= valueEnd; a single-value rating replaces the whole value.
function buildRatingRow(rule, property, extracted, bookmark) {
  const num = Number(extracted);
  const existing = (bookmark.numberValues ?? []).find(v => v.propertyId === property.id);
  if (!Number.isFinite(num)) {
    return baseRow(rule, existing ? formatScalar(existing.value) : "", extracted, false, "not found");
  }
  if (property.ratingAllowRange) {
    const bound = rule.target.ratingBound === "to" ? "to" : "from";
    const currentVal = existing
      ? (bound === "to" ? (existing.valueEnd ?? existing.value) : existing.value)
      : undefined;
    const changed = currentVal !== num;
    const row = baseRow(
      rule,
      `${bound}: ${currentVal === undefined ? "" : ratingLabelFor(property, currentVal)}`,
      `${bound}: ${ratingLabelFor(property, num)}`,
      changed,
      changed ? null : "no change",
    );
    row.apply = (patch, state) => {
      const map = seedValueMap(state, "numberValues", bookmark);
      const entry = map.get(property.id) ?? {
        propertyId: property.id,
        value: num,
        valueEnd: null,
      };
      if (bound === "from") {
        entry.value = num;
        if (entry.valueEnd != null && entry.valueEnd < num) entry.valueEnd = num;
      }
      else {
        entry.valueEnd = num;
        if (entry.value > num) entry.value = num;
      }
      map.set(property.id, entry);
    };
    return row;
  }
  const currentVal = existing ? existing.value : undefined;
  const changed = currentVal !== num;
  const row = baseRow(
    rule,
    currentVal === undefined ? "" : ratingLabelFor(property, currentVal),
    ratingLabelFor(property, num),
    changed,
    changed ? null : "no change",
  );
  row.apply = (patch, state) => {
    const map = seedValueMap(state, "numberValues", bookmark);
    map.set(property.id, {
      propertyId: property.id,
      value: num,
      valueEnd: null,
    });
  };
  return row;
}

// ratingScale "detect range": `values` are the present level numbers (from the engine's per-level
// detectors). Set From = min, To = max (single value when only one level is present). Replaces the
// whole rating value (both ends), unlike the from/to single-end fill.
function buildRatingRangeRow(rule, property, values, bookmark) {
  const levels = (values || [])
    .map(function (v) { return Number(v); })
    .filter(function (n) { return Number.isFinite(n); });
  const existing = (bookmark.numberValues ?? []).find(v => v.propertyId === property.id);
  const currentText = existing
    ? (existing.valueEnd != null && existing.valueEnd !== existing.value
      ? `${ratingLabelFor(property, existing.value)} → ${ratingLabelFor(property, existing.valueEnd)}`
      : ratingLabelFor(property, existing.value))
    : "";
  if (levels.length === 0) {
    return baseRow(rule, currentText, "", false, "not found");
  }
  const from = Math.min.apply(null, levels);
  const to = Math.max.apply(null, levels);
  const valueEnd = from === to ? null : to;
  const extractedText = from === to
    ? ratingLabelFor(property, from)
    : `${ratingLabelFor(property, from)} → ${ratingLabelFor(property, to)}`;
  const changed = !existing || existing.value !== from || (existing.valueEnd ?? null) !== valueEnd;
  const row = baseRow(rule, currentText, extractedText, changed, changed ? null : "no change");
  row.apply = (patch, state) => {
    const map = seedValueMap(state, "numberValues", bookmark);
    map.set(property.id, {
      propertyId: property.id,
      value: from,
      valueEnd: valueEnd,
    });
  };
  return row;
}

// choices: add the rule-selected option (target.choiceValue) to the bookmark's selected values;
// a single-select property is replaced, a multi-select unions.
function buildChoicesRow(rule, property, extracted, bookmark) {
  const choiceValue = rule.target.choiceValue;
  if (!choiceValue) {
    return baseRow(rule, "", extracted, false, "unsupported");
  }
  const option = (property.choicesItems ?? []).find(item => item.value === choiceValue);
  const optionLabel = option ? option.label : choiceValue;
  const existing = (bookmark.choicesValues ?? []).find(v => v.propertyId === property.id);
  const currentValues = existing ? existing.values : [];
  const currentLabels = currentValues
    .map(value => (property.choicesItems ?? []).find(item => item.value === value)?.label ?? value);
  const changed = property.choicesMultiple
    ? !currentValues.includes(choiceValue)
    : currentValues.length !== 1 || currentValues[0] !== choiceValue;
  const row = baseRow(rule, currentLabels.join(", ") || "—", optionLabel, changed, changed ? null : "no change");
  row.apply = (patch, state) => {
    const map = seedValueMap(state, "choicesValues", bookmark);
    const entry = map.get(property.id) ?? {
      propertyId: property.id,
      values: [],
    };
    entry.values = property.choicesMultiple
      ? Array.from(new Set([...entry.values, choiceValue]))
      : [choiceValue];
    map.set(property.id, entry);
  };
  return row;
}

function buildTaxonomyRow(rule, values, ctx) {
  const bookmark = ctx.bookmark;
  const kind = rule.target.taxonomy;
  const extractedNames = values;
  const assigned = (bookmark[kind] ?? []).map(x => x.name);
  if (!extractedNames.length) {
    return baseRow(rule, assigned.join(", ") || "—", "", false, "not found");
  }
  const assignedLower = new Set(assigned.map(n => n.toLowerCase()));
  const toAdd = extractedNames.filter(n => !assignedLower.has(n.toLowerCase()));
  if (!toAdd.length) {
    return baseRow(rule, assigned.join(", ") || "—", extractedNames.join(", "), false, "no change");
  }
  const optionList = (ctx.taxonomies && ctx.taxonomies[kind]) ? ctx.taxonomies[kind] : [];
  const optionLower = new Set(optionList.map(o => o.name.toLowerCase()));
  const newNames = toAdd.filter(n => !optionLower.has(n.toLowerCase()));

  const row = baseRow(rule, assigned.join(", ") || "—", extractedNames.join(", "), true, null);
  row.extractedNames = extractedNames;
  row.newNames = newNames;
  row.apply = async (patch, state) => {
    if (!state.tax[kind]) {
      state.tax[kind] = new Set((bookmark[kind] ?? []).map(x => x.id));
      // The PATCH is delete-then-relink, so we seed from the bookmark's *current* links to preserve
      // them. Record whether those links were actually hydrated: if `.people`/`.groups` were ever
      // absent, sending the id array would wipe links we couldn't see — see the transfer guard in
      // applyChanges.
      state.taxHydrated[kind] = Array.isArray(bookmark[kind]);
    }
    for (const name of toAdd) {
      const {
        id, created,
      } = await resolveTaxonomyId(serverUrl, kind, name, optionList);
      if (id) {
        state.tax[kind].add(id);
        if (created) state.created.push({
          kind,
          name,
        });
      }
      else {
        // Couldn't match or create — collect it so applyChanges surfaces it instead of the old
        // silent drop that still reported success.
        state.failed.push({
          kind,
          name,
        });
      }
    }
  };
  return row;
}

// Parse a `taxonomyEntity` target's `field` into its write mode (mirrors the server-side helper).
function entityWriteMode(field) {
  if (field === "language") return {
    kind: "language",
  };
  if (typeof field === "string" && field.indexOf("relation:") === 0) {
    return {
      kind: "relation",
      key: field.slice("relation:".length),
    };
  }
  return {
    kind: "scalar",
  };
}

// Sentinel selectedTermId meaning "apply to every linked term" (term ids are UUIDs, never "*"). A
// multi-term taxonomyEntity row defaults to this; the term picker (renderRow) can narrow it to one id.
const ALL_TERMS = "*";

// The terms an entity row applies to: every linked term in "all" mode, else the single picked term.
function entityTargetTerms(e) {
  if (e.selectedTermId === ALL_TERMS) return e.terms;
  return [e.terms.find(t => t.id === e.selectedTermId) || e.terms[0]];
}

// taxonomyEntity: write the extracted value into a taxonomy term the bookmark is *linked to* (not the
// bookmark). Dispatches on the target's write mode: a scalar field, a relation (id-array union), or a
// linked-term primary-language write. Auto-targets the single linked term, or shows a term picker (see
// renderRow) when several are linked — defaulting to all of them.
function buildTaxonomyEntityRow(rule, values, ctx) {
  const {
    association,
  } = rule.target;
  const meta = TAXONOMY_ENTITY_PATCH[association];
  if (!meta) return baseRow(rule, "", values[0] ?? "", false, "unsupported");
  const mode = entityWriteMode(rule.target.field);
  if (mode.kind === "relation") return buildEntityRelationRow(rule, values, ctx, meta, mode.key);
  if (mode.kind === "language") return buildEntityLanguageRow(rule, values, ctx, meta);
  return buildEntityScalarRow(rule, values, ctx, meta);
}

// Scalar taxonomyEntity write (name/description/year/socialLink) — the original behavior. On apply,
// the chosen term's field is PATCHed to that entity's own endpoint after the bookmark PATCH.
function buildEntityScalarRow(rule, values, ctx, meta) {
  const {
    association, field, socialPlatform,
  } = rule.target;
  const extracted = values[0] ?? "";
  if (field === "socialLink" && !socialPlatform) {
    return baseRow(rule, "", extracted, false, "unsupported");
  }
  if (!extracted) {
    return baseRow(rule, "", "", false, "not found");
  }
  const terms = (ctx.associatedTerms && ctx.associatedTerms[association]) || [];
  if (terms.length === 0) {
    return baseRow(rule, "—", extracted, false, `no linked ${meta.noun}`);
  }
  // `year` must coerce to a finite number, mirroring the bookmark year field.
  let coerced = extracted;
  if (field === "year") {
    const num = Number(extracted);
    if (!Number.isFinite(num)) {
      return baseRow(rule, "", extracted, false, "not found");
    }
    coerced = num;
  }
  // A multi-term row defaults to "all terms" (see ALL_TERMS); a single-term row auto-targets its term.
  const multi = terms.length > 1;
  const entity = {
    mode: "scalar",
    association,
    field,
    socialPlatform,
    meta,
    terms,
    extracted,
    coerced,
    selectedTermId: multi ? ALL_TERMS : terms[0].id,
  };
  const display = multi ? entityAllTermsDisplay(entity) : entityFieldDisplay(entity, terms[0]);
  // A multi-term row stays interactive even when every term is in sync — the user may narrow to one
  // term via the picker (renderRow). A single-term row that already matches is a plain "no change".
  const disabledReason = multi ? null : (display.changed ? null : "no change");
  const row = baseRow(rule, display.currentText, display.extractedText, display.changed, disabledReason);
  row.entity = entity;
  row.apply = (patch, state) => {
    accumulateEntityPatch(state, row);
  };
  return row;
}

// Relation taxonomyEntity write: resolve the extracted name(s) to related-taxonomy id(s) and UNION
// them into the linked term's id-array (e.g. add a Group to a linked Person's groups). Unmatched
// names for a match-only relation (websites/youtube-channels) surface as failures on apply.
function buildEntityRelationRow(rule, values, ctx, meta, key) {
  const relSpec = (meta.relations || []).find(r => r.key === key);
  if (!relSpec) return baseRow(rule, "", values[0] ?? "", false, "unsupported");
  const extractedNames = values;
  const terms = (ctx.associatedTerms && ctx.associatedTerms[rule.target.association]) || [];
  if (terms.length === 0) {
    return baseRow(rule, "—", extractedNames.join(", "), false, `no linked ${meta.noun}`);
  }
  if (!extractedNames.length) {
    return baseRow(rule, "—", "", false, "not found");
  }
  const optionList = (ctx.relationOptions && ctx.relationOptions[relSpec.optionKey]) || [];
  const multi = terms.length > 1;
  const entity = {
    mode: "relation",
    association: rule.target.association,
    meta,
    relSpec,
    optionList,
    terms,
    extractedNames,
    selectedTermId: multi ? ALL_TERMS : terms[0].id,
  };
  const display = multi ? entityAllTermsDisplay(entity) : entityRelationDisplay(entity, terms[0]);
  const disabledReason = multi ? null : (display.changed ? null : "no change");
  const row = baseRow(rule, display.currentText, "", display.changed, disabledReason);
  // Render the extracted names with new/unmatched badges (like a bookmark taxonomy row). Badges are
  // advisory and computed from the first term (as before) — they don't refresh on a term switch.
  row.extractedNames = extractedNames;
  row.newNames = entityRelationDisplay(entity, terms[0]).newNames;
  row.entity = entity;
  row.apply = async (patch, state) => {
    await accumulateRelationPatch(state, row);
  };
  return row;
}

// Primary-language taxonomyEntity write: resolve the extracted page-language code to a Language and
// attach it at the "Primary Language" level on the linked term. Applied in a dedicated phase (a PUT to
// the language-usages endpoint), merged with the term's existing usages.
function buildEntityLanguageRow(rule, values, ctx, meta) {
  const ownerType = meta.languageOwnerType;
  const extracted = values[0] ?? "";
  if (!ownerType) return baseRow(rule, "", extracted, false, "unsupported");
  if (ctx.primaryLanguageLevelId == null) {
    return baseRow(rule, "—", extracted, false, "no Primary Language level");
  }
  if (!extracted) {
    return baseRow(rule, "", "", false, "not found");
  }
  const terms = (ctx.associatedTerms && ctx.associatedTerms[rule.target.association]) || [];
  if (terms.length === 0) {
    return baseRow(rule, "—", extracted, false, `no linked ${meta.noun}`);
  }
  const multi = terms.length > 1;
  const entity = {
    mode: "language",
    association: rule.target.association,
    meta,
    ownerType,
    terms,
    extracted,
    languages: ctx.languages || [],
    primaryLevelId: ctx.primaryLanguageLevelId,
    selectedTermId: multi ? ALL_TERMS : terms[0].id,
  };
  const display = multi ? entityAllTermsDisplay(entity) : entityLanguageDisplay(entity, terms[0]);
  const disabledReason = multi ? null : display.disabledReason;
  const row = baseRow(rule, display.currentText, display.extractedText, display.changed, disabledReason);
  row.entity = entity;
  row.apply = (patch, state) => {
    accumulateLanguageWrite(state, row);
  };
  return row;
}

// The current stored value of an entity row's target field on `term` (undefined = unset).
function entityFieldValue(entity, term) {
  if (entity.field === "socialLink") {
    const link = (term.socialLinks || []).find(l => l.platform === entity.socialPlatform);
    return link ? link.url : undefined;
  }
  if (entity.field === "year") return term.year == null ? undefined : term.year;
  if (entity.field === "name") return term.name;
  return term.description == null ? undefined : term.description; // description
}

// Current / extracted display text + changed flag for an entity row against a specific term.
// Recomputed by the term picker (renderRow) when the user switches terms.
function entityFieldDisplay(entity, term) {
  const current = entityFieldValue(entity, term);
  if (entity.field === "year") {
    return {
      currentText: formatScalar(current),
      extractedText: String(entity.coerced),
      changed: current !== entity.coerced,
    };
  }
  return {
    currentText: formatScalar(current),
    extractedText: entity.extracted,
    changed: (current ?? "") !== entity.extracted,
  };
}

// Merge a row's field change into each targeted term's PATCH bucket (every linked term in "all" mode,
// else the one picked term). Keyed by association:termId so several rules targeting the same term
// collapse into one PATCH; socialLink upserts into a copy of that term's current links so its other
// platforms survive.
function accumulateEntityPatch(state, row) {
  const e = row.entity;
  for (const term of entityTargetTerms(e)) writeEntityBucket(state, e, term);
}

function writeEntityBucket(state, e, term) {
  const termId = term.id;
  const key = `${e.association}:${termId}`;
  let bucket = state.entityPatches[key];
  if (!bucket) {
    bucket = {
      path: e.meta.path,
      id: termId,
      patch: {},
      socialSeeded: false,
    };
    state.entityPatches[key] = bucket;
  }
  if (e.field === "socialLink") {
    if (!bucket.socialSeeded) {
      bucket.patch.socialLinks = (term.socialLinks || []).map(l => ({
        platform: l.platform,
        url: l.url,
      }));
      bucket.socialSeeded = true;
    }
    const links = bucket.patch.socialLinks;
    const idx = links.findIndex(l => l.platform === e.socialPlatform);
    const next = {
      platform: e.socialPlatform,
      url: e.extracted,
    };
    if (idx >= 0) links[idx] = next;
    else links.push(next);
  }
  else if (e.field === "name") {
    bucket.patch[e.meta.nameKey] = e.extracted;
  }
  else if (e.field === "year") {
    bucket.patch.year = e.coerced;
  }
  else {
    bucket.patch.description = e.extracted;
  }
}

// PATCH each accumulated taxonomy-entity bucket (best-effort, after the bookmark PATCH). Returns the
// number of linked terms updated vs failed.
async function applyEntityPatches(entityPatches) {
  let updated = 0;
  let failed = 0;
  for (const key of Object.keys(entityPatches)) {
    const bucket = entityPatches[key];
    if (!bucket || Object.keys(bucket.patch).length === 0) continue;
    try {
      const res = await fetch(`${serverUrl}${bucket.path}/${bucket.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bucket.patch),
      });
      if (res.ok) updated += 1;
      else failed += 1;
    }
    catch {
      failed += 1;
    }
  }
  return {
    updated,
    failed,
  };
}

// --- taxonomyDirect: update a taxonomy entity resolved from the page --------
// A `taxonomyDirect` rule updates a taxonomy *entity* identified from the current page (not via a
// linked bookmark). Two resolution modes: `url` (the server pre-resolved the entity into
// ctx.associatedTerms) and `match` (the engine scraped an identifier — resolveValue — resolved to an
// id at apply-time). Fields reuse the entity-PATCH path for JSON, plus a `${path}/image` upload.

// Match-mode associations that may mint a name-only stub when unmatched (the taxonomy list endpoints
// resolveTaxonomyId targets). website/youtubeChannel/etc. are match-only — never stubbed.
const MATCH_CREATABLE = new Set(["people", "groups", "locations", "tags"]);

function buildTaxonomyDirectRow(rule, result, ctx) {
  const {
    association, resolve, field, socialPlatform,
  } = rule.target;
  const meta = TAXONOMY_ENTITY_PATCH[association];
  const values = result?.values ?? [];
  if (!meta || (field === "socialLink" && !socialPlatform) || (field === "image" && !meta.image)) {
    return baseRow(rule, "", values[0] ?? "", false, "unsupported");
  }

  if (resolve?.mode === "url") {
    const terms = (ctx.associatedTerms && ctx.associatedTerms[association]) || [];
    if (terms.length === 0) {
      return baseRow(rule, "—", field === "image" ? "" : (values[0] ?? ""), false, `no matching ${meta.noun}`);
    }
    // The server resolves a url-mode entity to exactly one term.
    const term = terms[0];
    if (field === "image") return buildDirectImageRow(rule, values, meta, term.id, term.imageUrl);
    return buildDirectEntityFieldRow(rule, values, meta, association, field, socialPlatform, term);
  }

  // match mode: the entity is identified by a scraped name resolved at apply-time.
  const name = result?.resolveValue ? result.resolveValue.trim() : "";
  if (!name) {
    return baseRow(rule, "—", field === "image" ? "" : (values[0] ?? ""), false, "no entity name");
  }
  if (field === "image") {
    const urls = values.map(resolveImageUrl).filter(url => url !== null);
    if (!urls.length) return baseRow(rule, "—", "", false, "not found");
    const row = baseRow(rule, "—", `${urls.length} image → ${name}`, true, null);
    row.directEntity = {
      meta,
      association,
      resolveMode: "match",
      resolveName: name,
      field: "image",
      imageUrls: urls,
    };
    return row;
  }
  const extracted = values[0] ?? "";
  if (!extracted) return baseRow(rule, "—", "", false, "not found");
  let coerced = extracted;
  if (field === "year") {
    const num = Number(extracted);
    if (!Number.isFinite(num)) return baseRow(rule, "—", extracted, false, "not found");
    coerced = num;
  }
  const row = baseRow(rule, `match: ${name}`, field === "year" ? String(coerced) : extracted, true, null);
  row.directEntity = {
    meta,
    association,
    resolveMode: "match",
    resolveName: name,
    field,
    socialPlatform,
    value: extracted,
    coerced,
  };
  return row;
}

// url-mode JSON field: reuse the existing taxonomyEntity apply path (single term, no picker) so name/
// description/year/socialLink go through accumulateEntityPatch → applyEntityPatches (socialLink seeds
// from the term's current links, preserving other platforms).
function buildDirectEntityFieldRow(rule, values, meta, association, field, socialPlatform, term) {
  const extracted = values[0] ?? "";
  if (!extracted) return baseRow(rule, "", "", false, "not found");
  let coerced = extracted;
  if (field === "year") {
    const num = Number(extracted);
    if (!Number.isFinite(num)) return baseRow(rule, "", extracted, false, "not found");
    coerced = num;
  }
  const entity = {
    mode: "scalar",
    association,
    field,
    socialPlatform,
    meta,
    terms: [term],
    extracted,
    coerced,
    selectedTermId: term.id,
  };
  const display = entityFieldDisplay(entity, term);
  const row = baseRow(rule, display.currentText, display.extractedText, display.changed, display.changed ? null : "no change");
  row.entity = entity;
  row.apply = (patch, state) => {
    accumulateEntityPatch(state, row);
  };
  return row;
}

// url-mode image field: grab image URL(s) and, on apply, upload the bytes to the entity's image endpoint.
function buildDirectImageRow(rule, values, meta, termId, currentImageUrl) {
  const urls = values.map(resolveImageUrl).filter(url => url !== null);
  const currentText = currentImageUrl ? "1 image" : "—";
  if (!urls.length) return baseRow(rule, currentText, "", false, "not found");
  const row = baseRow(rule, currentText, `${urls.length} image`, true, null);
  row.directEntity = {
    meta,
    resolveMode: "url",
    termId,
    field: "image",
    imageUrls: urls,
  };
  return row;
}

// Apply each checked taxonomyDirect row (after the bookmark/linked-term PATCHes). Resolves the entity
// id (url-mode: the term id; match-mode: match-or-create against the list endpoint), then PATCHes a
// JSON field or uploads an image. Returns { updated, failed } and records created/failed stub names.
async function applyDirectRows(rows, state) {
  let updated = 0;
  let failed = 0;
  for (const row of rows) {
    const d = row.directEntity;
    let id = d.termId || null;
    let record = null;
    if (!id && d.resolveMode === "match") {
      const resolved = await resolveEntityId(d.meta, d.resolveName, MATCH_CREATABLE.has(d.association));
      id = resolved.id;
      record = resolved.record;
      // Only kinds with a plural noun (people/groups/locations/tags) are stub-creatable + summarizable.
      if (resolved.created && TAX_NOUN[d.association]) {
        state.created.push({
          kind: d.association,
          name: d.resolveName,
        });
      }
    }
    if (!id) {
      failed += 1;
      if (d.resolveMode === "match" && TAX_NOUN[d.association]) {
        state.failed.push({
          kind: d.association,
          name: d.resolveName,
        });
      }
      continue;
    }
    let ok;
    if (d.field === "image") {
      ok = false;
      for (const url of d.imageUrls) {
        if (await uploadEntityImageFromUrl(d.meta.path, id, url)) ok = true;
      }
    }
    else {
      ok = await patchEntity(d.meta.path, id, buildDirectPatch(d, record));
    }
    if (ok) updated += 1;
    else failed += 1;
  }
  return {
    updated,
    failed,
  };
}

// Resolve a match-mode entity by its scraped name: match an existing row (case-insensitive on the
// entity's name key), else create a name-only stub when allowed. Returns the matched raw record too so
// a socialLink patch can seed from its current links.
async function resolveEntityId(meta, name, allowCreate) {
  const lower = name.toLowerCase();
  try {
    const res = await fetch(`${serverUrl}${meta.path}`);
    if (res.ok) {
      const all = await res.json();
      const match = Array.isArray(all)
        ? all.find(o => o && typeof o[meta.nameKey] === "string" && o[meta.nameKey].toLowerCase() === lower)
        : null;
      if (match) return {
        id: match.id,
        created: false,
        record: match,
      };
    }
  }
  catch {
    // fall through
  }
  if (!allowCreate) return {
    id: null,
    created: false,
    record: null,
  };
  try {
    const res = await fetch(`${serverUrl}${meta.path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        [meta.nameKey]: name,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      if (created && created.id) return {
        id: created.id,
        created: true,
        record: created,
      };
    }
  }
  catch {
    // give up
  }
  return {
    id: null,
    created: false,
    record: null,
  };
}

// Build the JSON PATCH body for a match-mode direct field. socialLink upserts into the entity's
// current links (from `record`) so other platforms survive.
function buildDirectPatch(d, record) {
  if (d.field === "socialLink") {
    const links = ((record && record.socialLinks) || []).map(l => ({
      platform: l.platform,
      url: l.url,
    }));
    const idx = links.findIndex(l => l.platform === d.socialPlatform);
    const next = {
      platform: d.socialPlatform,
      url: d.value,
    };
    if (idx >= 0) links[idx] = next;
    else links.push(next);
    return {
      socialLinks: links,
    };
  }
  if (d.field === "name") return {
    [d.meta.nameKey]: d.value,
  };
  if (d.field === "year") return {
    year: d.coerced,
  };
  return {
    description: d.value,
  };
}

// PATCH a taxonomy entity's JSON field. Returns true on success.
async function patchEntity(path, id, patch) {
  try {
    const res = await fetch(`${serverUrl}${path}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    });
    return res.ok;
  }
  catch {
    return false;
  }
}

// Fetch an image URL and upload the bytes to a taxonomy entity's replace-style image endpoint
// (`POST ${path}/${id}/image`, no `?main`). Returns true on success.
async function uploadEntityImageFromUrl(path, id, url) {
  try {
    const imageRes = await fetch(url);
    if (!imageRes.ok) return false;
    const blob = await imageRes.blob();
    if (!blob || blob.size === 0) return false;
    const form = new FormData();
    form.append("file", blob, "image");
    const res = await fetch(`${serverUrl}${path}/${id}/image`, {
      method: "POST",
      body: form,
    });
    return res.ok;
  }
  catch {
    return false;
  }
}

// --- Relation taxonomyEntity write -------------------------------------
// Current/extracted display for a relation row against a specific term: which extracted names are
// already linked, which will be created (creatable relation), and which have no match (match-only).
function entityRelationDisplay(entity, term) {
  const relSpec = entity.relSpec;
  const currentIds = Array.isArray(term[relSpec.patchKey]) ? term[relSpec.patchKey] : [];
  const optByLower = {};
  const optById = {};
  for (const o of entity.optionList) {
    optByLower[o.name.toLowerCase()] = o;
    optById[o.id] = o;
  }
  const currentIdSet = {};
  currentIds.forEach((id) => {
    currentIdSet[id] = true;
  });
  const currentNames = currentIds
    .map(id => (optById[id] ? optById[id].name : null))
    .filter(name => name !== null);
  const toAdd = [];
  const newNames = [];
  const unmatchedNames = [];
  for (const name of entity.extractedNames) {
    const opt = optByLower[name.toLowerCase()];
    if (opt && currentIdSet[opt.id]) continue; // already linked — skip
    toAdd.push(name);
    if (!opt) (relSpec.matchOnly ? unmatchedNames : newNames).push(name);
  }
  return {
    currentText: currentNames.join(", ") || "—",
    changed: toAdd.length > 0,
    toAdd,
    newNames,
    unmatchedNames,
  };
}

// Merge a relation row's resolved ids into each targeted term's entity PATCH bucket (unioned with that
// term's current ids, seeded once). Reuses the same bucket as scalar/socialLink writes so a term
// getting a relation + a scalar is one PATCH. Skips a term whose current ids weren't hydrated (wipe
// guard). In "all" mode every linked term gets the same ids; the extracted names are resolved ONCE
// (term-independent) so created/failed are recorded once rather than duplicated per term.
async function accumulateRelationPatch(state, row) {
  const e = row.entity;
  const relSpec = e.relSpec;
  const resolvedIds = [];
  for (const name of e.extractedNames) {
    const {
      id, created,
    } = await resolveRelationId(serverUrl, relSpec, name, e.optionList);
    if (id) {
      resolvedIds.push(id);
      if (created) state.created.push({
        kind: relSpec.optionKey,
        name,
      });
    }
    else {
      // Match-only miss (or a create failure) — surface it instead of silently dropping.
      state.failed.push({
        kind: relSpec.optionKey,
        name,
      });
    }
  }
  for (const term of entityTargetTerms(e)) {
    const currentIds = Array.isArray(term[relSpec.patchKey]) ? term[relSpec.patchKey] : null;
    if (currentIds === null) continue; // not hydrated — don't risk wiping unseen links
    const key = `${e.association}:${term.id}`;
    let bucket = state.entityPatches[key];
    if (!bucket) {
      bucket = {
        path: e.meta.path,
        id: term.id,
        patch: {},
        socialSeeded: false,
        relationSeeded: {},
      };
      state.entityPatches[key] = bucket;
    }
    if (!bucket.relationSeeded) bucket.relationSeeded = {};
    if (!bucket.relationSeeded[relSpec.patchKey]) {
      bucket.patch[relSpec.patchKey] = currentIds.slice();
      bucket.relationSeeded[relSpec.patchKey] = true;
    }
    const idSet = new Set(bucket.patch[relSpec.patchKey]);
    for (const id of resolvedIds) idSet.add(id); // union — already-linked ids are a no-op
    bucket.patch[relSpec.patchKey] = Array.from(idSet);
  }
}

// --- Language taxonomyEntity write -------------------------------------
// Current/extracted display for a language row against a term: the term's existing primary-language
// (if any) vs the resolved incoming language. Never clobbers an existing pick ("already set").
function entityLanguageDisplay(entity, term) {
  const usages = Array.isArray(term.languageUsages) ? term.languageUsages : [];
  const existingPrimary = usages.find(u => u.usageLevelId === entity.primaryLevelId);
  const languageName = (id) => {
    const lang = entity.languages.find(l => l.id === id);
    return lang ? lang.name : null;
  };
  const currentText = existingPrimary ? formatScalar(languageName(existingPrimary.languageId)) : "—";
  const normalized = normalizeLanguageCode(entity.extracted);
  const match = normalized ? entity.languages.find(l => l.isoCode === normalized) : null;
  const extractedText = match ? match.name : (normalized || entity.extracted);
  if (existingPrimary) {
    return {
      currentText,
      extractedText,
      changed: false,
      disabledReason: "already set",
    };
  }
  if (!normalized) {
    return {
      currentText,
      extractedText,
      changed: false,
      disabledReason: "not found",
    };
  }
  return {
    currentText,
    extractedText,
    changed: true,
    disabledReason: null,
  };
}

// Queue a language row for the dedicated language-write phase (a PUT to the language-usages endpoint).
function accumulateLanguageWrite(state, row) {
  if (!state.languageWrites) state.languageWrites = [];
  state.languageWrites.push(row);
}

// Apply each checked language row: resolve the code to a Language, merge the primary-level entry into
// the term's existing usages (the PUT is replace-all), and PUT. Returns updated/failed counts.
async function applyLanguageWrites(languageRows) {
  let updated = 0;
  let failed = 0;
  for (const row of languageRows) {
    const e = row.entity;
    // Resolve the language ONCE (term-independent), then PUT for each targeted term (all linked terms
    // in "all" mode). Terms already carrying a primary language are skipped so counts stay honest.
    const {
      id,
    } = await resolveLanguageId(serverUrl, e.extracted, e.languages);
    if (!id) {
      failed += 1;
      continue;
    }
    for (const term of entityTargetTerms(e)) {
      if (!entityLanguageDisplay(e, term).changed) continue; // already set / nothing to do for this term
      const existing = Array.isArray(term.languageUsages) ? term.languageUsages : [];
      const entries = existing.map(u => ({
        languageId: u.languageId,
        usageLevelId: u.usageLevelId,
      }));
      const key = `${id}:${e.primaryLevelId}`;
      if (!entries.some(en => `${en.languageId}:${en.usageLevelId}` === key)) {
        entries.push({
          languageId: id,
          usageLevelId: e.primaryLevelId,
        });
      }
      try {
        const res = await fetch(`${serverUrl}/api/language-usages/${e.ownerType}/${term.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entries,
          }),
        });
        if (res.ok) updated += 1;
        else failed += 1;
      }
      catch {
        failed += 1;
      }
    }
  }
  return {
    updated,
    failed,
  };
}

// Mode-aware current/extracted display for an entity row against a term (used by the term picker).
function entityDisplayForTerm(entity, term) {
  if (entity.mode === "relation") {
    const d = entityRelationDisplay(entity, term);
    return {
      currentText: d.currentText,
      changed: d.changed,
    };
  }
  if (entity.mode === "language") {
    return entityLanguageDisplay(entity, term);
  }
  return entityFieldDisplay(entity, term);
}

// Aggregate current/extracted display when the row targets ALL linked terms. `changed` is true when
// ANY term would change (drives the checkbox default); `extractedText` is term-independent (same value
// for every term), so borrow the first term's — `undefined` for relation rows, which render
// `extractedNames` instead. `currentText` summarizes the count since per-term current values diverge.
function entityAllTermsDisplay(entity) {
  let changed = false;
  for (const t of entity.terms) {
    if (entityDisplayForTerm(entity, t).changed) {
      changed = true;
      break;
    }
  }
  const base = entityDisplayForTerm(entity, entity.terms[0]);
  return {
    currentText: `${entity.terms.length} terms`,
    extractedText: base.extractedText,
    changed,
  };
}

// --- Value formatting / coercion ---------------------------------------
function formatScalar(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function formatBoolean(value) {
  if (value === null || value === undefined) return "—";
  return value ? "Yes" : "No";
}

function coerceBoolean(text) {
  const t = text.trim().toLowerCase();
  if (/^(true|yes|y|1|on)$/.test(t)) return true;
  if (/^(false|no|n|0|off)$/.test(t)) return false;
  return null;
}

// --- Review rendering ---------------------------------------------------
function renderReview(bookmark, rows, groups) {
  fillReviewTitle.textContent = bookmark?.title ?? currentTab?.title ?? "";
  fillError.classList.add("hidden");
  fillError.textContent = "";
  fillApplyBtn.classList.remove("hidden");
  fillApplyBtn.disabled = false;
  fillApplyBtn.textContent = "Apply";
  fillRows.innerHTML = "";
  appendGroupedRows(fillRows, rows, groups || []);
  // No bookmark (taxonomy mode) → nothing to open.
  fillReviewOpenBtn.classList.toggle("hidden", !bookmark);
  fillReviewOpenBtn.onclick = () => openBookmark(bookmark?.id);
  // A screenshot can be taken here without first applying the pending autofill changes.
  wireDescriptionEditor(DESCRIPTION_EDITORS.review, bookmark);
  wireCaptureButton(captureReviewBtn, captureReviewStatus, bookmark?.id);
  wireFindSelectorButton(findSelectorReviewBtn, findSelectorReviewStatus);
  // Selection/apply run off the (unchanged) `rows` array, so grouping the DOM never affects them.
  fillApplyBtn.onclick = () => void applyChanges(rows, bookmark);
  show("review");
}

/** A collapsible group section, expanded by default. `<summary>` (not a `<label>`) never toggles a row checkbox. */
function makeGroupDetails(label, isChild) {
  const details = document.createElement("details");
  details.open = true;
  details.className = isChild ? "fill-group fill-group-child" : "fill-group";
  const summary = document.createElement("summary");
  summary.className = "fill-group-header";
  summary.textContent = label || "(unnamed group)";
  details.appendChild(summary);
  return details;
}

/**
 * Render the review rows bucketed by their rule group (two tiers) into collapsible sections, with
 * ungrouped rows flat. Every row is rendered exactly once — a leftover pass at the end catches
 * ungrouped, stale-groupId, and orphaned-child rows so nothing is ever dropped.
 */
function appendGroupedRows(container, rows, groups) {
  const rendered = new Set();
  const rowsForGroup = id => rows.filter(r => r.rule && r.rule.groupId === id);
  const render = (target, row) => {
    target.appendChild(renderRow(row));
    rendered.add(row);
  };
  for (const top of groups.filter(g => !g.parentId)) {
    const childSets = groups
      .filter(g => g.parentId === top.id)
      .map(child => ({
        group: child,
        rows: rowsForGroup(child.id),
      }));
    const ownRows = rowsForGroup(top.id);
    if (ownRows.length === 0 && childSets.every(cs => cs.rows.length === 0)) continue;
    const details = makeGroupDetails(top.label, false);
    for (const row of ownRows) render(details, row);
    for (const cs of childSets) {
      if (cs.rows.length === 0) continue;
      const childDetails = makeGroupDetails(cs.group.label, true);
      for (const row of cs.rows) render(childDetails, row);
      details.appendChild(childDetails);
    }
    container.appendChild(details);
  }
  for (const row of rows) {
    if (!rendered.has(row)) container.appendChild(renderRow(row));
  }
}

function renderRow(row) {
  const wrap = document.createElement("label");
  wrap.className = row.disabledReason ? "fill-row disabled" : "fill-row";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = row.changed && !row.disabledReason;
  cb.disabled = !!row.disabledReason;
  row.checkbox = cb;
  wrap.appendChild(cb);

  const body = document.createElement("div");
  body.className = "fill-body";

  const label = document.createElement("div");
  label.className = "fill-label";
  label.textContent = row.label;
  if (row.disabledReason) {
    const note = document.createElement("span");
    note.className = "fill-note";
    note.textContent = ` — ${row.disabledReason}`;
    label.appendChild(note);
  }
  body.appendChild(label);

  // A `taxonomyEntity` row linked to more than one term gets a term picker; switching it recomputes
  // the current → extracted display and the checkbox default in place.
  let curSpan = null;
  let extSpan = null;
  if (row.entity && row.entity.terms.length > 1 && !row.disabledReason) {
    body.appendChild(renderTermPicker(row, () => {
      const display = row.entity.selectedTermId === ALL_TERMS
        ? entityAllTermsDisplay(row.entity)
        : entityDisplayForTerm(row.entity, row.entity.terms.find(t => t.id === row.entity.selectedTermId));
      row.currentText = display.currentText;
      row.changed = display.changed;
      if (curSpan) curSpan.textContent = display.currentText;
      // A relation row renders extracted names (no extractedText); only refresh it when present.
      if (display.extractedText !== undefined) {
        row.extractedText = display.extractedText;
        if (extSpan) extSpan.textContent = display.extractedText || "(not found)";
      }
      row.checkbox.checked = display.changed;
    }));
  }

  // A changed `sections` row renders a per-section diff instead of the coarse current → extracted text.
  if (row.sectionsDiff && row.changed && !row.disabledReason) {
    body.appendChild(renderSectionsDiff(row.sectionsDiff));
    wrap.appendChild(body);
    return wrap;
  }

  const valuesEl = document.createElement("div");
  valuesEl.className = "fill-values";
  if (row.currentText) {
    curSpan = document.createElement("span");
    curSpan.className = "fill-current";
    curSpan.textContent = row.currentText;
    valuesEl.appendChild(curSpan);
    const arrow = document.createElement("span");
    arrow.className = "fill-arrow";
    arrow.textContent = " → ";
    valuesEl.appendChild(arrow);
  }
  if (row.extractedNames) {
    appendNames(valuesEl, row.extractedNames, row.newNames, row.unmatchedNames);
  }
  else {
    extSpan = document.createElement("span");
    extSpan.className = "fill-extracted";
    extSpan.textContent = row.extractedText || "(not found)";
    valuesEl.appendChild(extSpan);
  }
  body.appendChild(valuesEl);

  wrap.appendChild(body);
  return wrap;
}

// Render a per-section diff (from diffSections) as a compact stack of one-line entries: changed
// ("~ Name: old → new" + child-count note), added ("+ …"), removed ("− …"), then a muted "N unchanged".
function renderSectionsDiff(diff) {
  const box = document.createElement("div");
  box.className = "fill-sections";
  for (const item of diff) {
    const line = document.createElement("div");
    if (item.kind === "changed") {
      line.className = "fill-sec-changed";
      let text = `~ ${item.oldLabel} → ${item.newLabel}`;
      if (item.oldChildren !== item.newChildren) {
        const items = n => `${n} item${n === 1 ? "" : "s"}`;
        text += ` · ${items(item.oldChildren)} → ${items(item.newChildren)}`;
      }
      line.textContent = text;
    }
    else if (item.kind === "added") {
      line.className = "fill-sec-added";
      line.textContent = `+ ${item.newLabel}`;
    }
    else if (item.kind === "removed") {
      line.className = "fill-sec-removed";
      line.textContent = `− ${item.oldLabel}`;
    }
    else {
      line.className = "fill-sec-unchanged";
      line.textContent = `${item.count} unchanged`;
    }
    box.appendChild(line);
  }
  return box;
}

// A `<select>` of the linked terms for a multi-term entity row. Interacting with it must not toggle
// the row's checkbox (the row is a <label>), so pointer events are stopped from bubbling. `onPick`
// re-reads `selectedTermId` and refreshes the row.
function renderTermPicker(row, onPick) {
  const sel = document.createElement("select");
  sel.className = "fill-term-select";
  // "All terms" (the default) applies the value to every linked term; the per-term options narrow it.
  const all = document.createElement("option");
  all.value = ALL_TERMS;
  all.textContent = `All terms (${row.entity.terms.length})`;
  sel.appendChild(all);
  for (const term of row.entity.terms) {
    const opt = document.createElement("option");
    opt.value = term.id;
    opt.textContent = term.name;
    sel.appendChild(opt);
  }
  sel.value = row.entity.selectedTermId;
  sel.addEventListener("mousedown", e => e.stopPropagation());
  sel.addEventListener("click", e => e.stopPropagation());
  sel.addEventListener("change", () => {
    row.entity.selectedTermId = sel.value;
    onPick();
  });
  return sel;
}

function appendNames(container, names, newNames, unmatchedNames) {
  const newLower = new Set((newNames || []).map(n => n.toLowerCase()));
  const unmatchedLower = new Set((unmatchedNames || []).map(n => n.toLowerCase()));
  names.forEach((name, i) => {
    if (i > 0) container.appendChild(document.createTextNode(", "));
    const span = document.createElement("span");
    span.className = "fill-extracted";
    span.textContent = name;
    container.appendChild(span);
    if (newLower.has(name.toLowerCase())) {
      const badge = document.createElement("span");
      badge.className = "badge-new";
      badge.textContent = "new";
      container.appendChild(badge);
    }
    else if (unmatchedLower.has(name.toLowerCase())) {
      // A match-only relation (website / YouTube channel) with no existing match — won't be created.
      const note = document.createElement("span");
      note.className = "fill-note";
      note.textContent = " (no match)";
      container.appendChild(note);
    }
  });
}

// --- Apply --------------------------------------------------------------
async function applyChanges(rows, bookmark) {
  const checked = rows.filter(row => row.checkbox && row.checkbox.checked);
  const imageRows = checked.filter(row => row.image);
  const entityRows = checked.filter(row => row.entity);
  // `taxonomyDirect` rows resolved from the page (url-mode image + all match-mode): applied separately.
  const directRows = checked.filter(row => row.directEntity);
  // Bookmark-field rows: everything that isn't an image upload, an associated-taxonomy PATCH, or a
  // direct taxonomy-entity update.
  const patchRows = checked.filter(row => !row.image && !row.entity && !row.directEntity);
  fillApplyBtn.disabled = true;
  fillApplyBtn.textContent = "Applying…";
  fillError.classList.add("hidden");

  // Accumulators shared across rows: taxonomy id sets (unioned with existing), custom-property value
  // maps (seeded from existing so siblings aren't wiped), per-kind hydration flags (the wipe guard),
  // per-entity PATCH buckets for associated-taxonomy updates, and the created / failed taxonomy names
  // for the post-apply summary.
  const state = {
    tax: {},
    values: {},
    taxHydrated: {},
    entityPatches: {},
    languageWrites: [],
    created: [],
    failed: [],
  };
  const patch = {};

  try {
    for (const row of patchRows) {
      await row.apply(patch, state);
    }
    for (const row of entityRows) {
      await row.apply(patch, state);
    }
    for (const kind of Object.keys(state.tax)) {
      // Skip a kind whose current links weren't hydrated: the delete-then-relink PATCH would wipe
      // links we couldn't see. This never triggers today (hydration always returns .people/.groups),
      // but it keeps a future hydration change from silently dropping links.
      if (state.taxHydrated[kind]) {
        patch[TAX_PATCH_KEY[kind]] = Array.from(state.tax[kind]);
      }
    }
    for (const key of Object.keys(state.values)) {
      patch[key] = Array.from(state.values[key].values());
    }

    // Only PATCH the bookmark when there is one (taxonomy mode has none) and there's something to change.
    if (bookmark && Object.keys(patch).length > 0) {
      const res = await fetch(`${serverUrl}/api/bookmarks/${bookmark.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      // Keep the in-memory bookmark's description current so the applied screen's editor prefills the
      // just-applied value (rather than the pre-apply one) when a description fill row was applied.
      if (Object.prototype.hasOwnProperty.call(patch, "description")) {
        bookmark.description = patch.description;
      }
    }

    // Associated-taxonomy PATCHes run after the bookmark PATCH (best-effort): each linked term's
    // changed field / relation is written to that entity's own endpoint. A failure here surfaces a
    // note but doesn't undo the bookmark PATCH.
    const entityResult = await applyEntityPatches(state.entityPatches);

    // Language writes run next (best-effort): each linked term's primary language is merged into its
    // language usages via the language-usages endpoint.
    const languageResult = await applyLanguageWrites(state.languageWrites);

    // Direct taxonomy-entity updates (url-resolved or match-resolved) run next (best-effort).
    const directResult = await applyDirectRows(directRows, state);

    // Image uploads run last (best-effort): the browser downloads each grabbed image and uploads the
    // bytes to the bookmark. A failure here surfaces a note but doesn't undo the PATCH.
    const imageResult = await applyImageRows(imageRows, bookmark ? bookmark.id : null);

    const n = patchRows.length + imageResult.uploaded;
    const parts = [];
    if (n > 0) parts.push(`Updated ${n} field${n === 1 ? "" : "s"}.`);
    // Note freshly-created taxonomy stubs, then any that couldn't be created (best-effort: a taxonomy
    // failure doesn't undo the rest of the PATCH, but it must never be silently swallowed).
    if (state.created.length > 0) parts.push(summarizeCreated(state.created));
    if (state.failed.length > 0) parts.push(summarizeFailed(state.failed));
    if (entityResult.updated > 0) {
      parts.push(`Updated ${entityResult.updated} linked item${entityResult.updated === 1 ? "" : "s"}.`);
    }
    if (entityResult.failed > 0) {
      parts.push(`${entityResult.failed} linked item${entityResult.failed === 1 ? "" : "s"} couldn't be updated.`);
    }
    if (languageResult.updated > 0) {
      parts.push(`Set language on ${languageResult.updated} linked item${languageResult.updated === 1 ? "" : "s"}.`);
    }
    if (languageResult.failed > 0) {
      parts.push(`${languageResult.failed} language${languageResult.failed === 1 ? "" : "s"} couldn't be set.`);
    }
    if (directResult.updated > 0) {
      parts.push(`Updated ${directResult.updated} taxonomy ${directResult.updated === 1 ? "entity" : "entities"}.`);
    }
    if (directResult.failed > 0) {
      parts.push(`${directResult.failed} taxonomy ${directResult.failed === 1 ? "entity" : "entities"} couldn't be updated.`);
    }
    if (imageResult.failed > 0) {
      parts.push(`${imageResult.failed} image${imageResult.failed === 1 ? "" : "s"} couldn't be saved.`);
    }
    fillAppliedMsg.textContent = parts.join(" ") || "No changes applied.";
    // No bookmark (taxonomy mode) → nothing to open or screenshot.
    fillAppliedOpenBtn.classList.toggle("hidden", !bookmark);
    fillAppliedOpenBtn.onclick = () => openBookmark(bookmark?.id);
    wireDescriptionEditor(DESCRIPTION_EDITORS.applied, bookmark);
    wireCaptureButton(captureAppliedBtn, captureAppliedStatus, bookmark?.id);
    wireDeleteButton(deleteAppliedBtn, deleteAppliedStatus, bookmark?.id);
    show("applied");
  }
  catch {
    fillApplyBtn.disabled = false;
    fillApplyBtn.textContent = "Apply";
    fillError.textContent = "Couldn't apply the changes. Please try again.";
    fillError.classList.remove("hidden");
  }
}

// Download each checked image row's URL(s) in the browser and upload the bytes to the bookmark's
// additive images endpoint. `setMain` is applied to the first successfully-uploaded image only.
// Returns counts of uploaded vs failed images.
async function applyImageRows(imageRows, bookmarkId) {
  let uploaded = 0;
  let failed = 0;
  for (const row of imageRows) {
    let firstOfRow = true;
    for (const url of row.image.urls) {
      const ok = await uploadImageFromUrl(bookmarkId, url, row.image.setMain && firstOfRow);
      if (ok) {
        uploaded += 1;
        firstOfRow = false;
      }
      else {
        failed += 1;
      }
    }
  }
  return {
    uploaded,
    failed,
  };
}

// Fetch an image URL (the popup has host permissions, so this is CORS-free) and upload the bytes as
// multipart to POST /api/bookmarks/:id/images. Returns true on success, false on any failure.
async function uploadImageFromUrl(bookmarkId, url, setMain) {
  try {
    const imageRes = await fetch(url);
    if (!imageRes.ok) return false;
    const blob = await imageRes.blob();
    if (!blob || blob.size === 0) return false;
    const form = new FormData();
    form.append("file", blob, "image");
    const query = setMain ? "?main=true" : "";
    const res = await fetch(`${serverUrl}/api/bookmarks/${bookmarkId}/images${query}`, {
      method: "POST",
      body: form,
    });
    return res.ok;
  }
  catch {
    return false;
  }
}
