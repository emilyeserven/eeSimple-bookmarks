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

// Fill-mode screens
const inboxStateEl = document.getElementById("inboxState");
const inboxViewBtn = document.getElementById("inboxViewBtn");
const savedStateEl = document.getElementById("savedState");
const savedOpenBtn = document.getElementById("savedOpenBtn");
const fillFillingEl = document.getElementById("fillFilling");
const fillFillingTitle = document.getElementById("fillFillingTitle");
const fillReviewEl = document.getElementById("fillReview");
const fillReviewTitle = document.getElementById("fillReviewTitle");
const fillError = document.getElementById("fillError");
const fillRows = document.getElementById("fillRows");
const fillApplyBtn = document.getElementById("fillApplyBtn");
const fillReviewOpenBtn = document.getElementById("fillReviewOpenBtn");
const fillAppliedEl = document.getElementById("fillApplied");
const fillAppliedMsg = document.getElementById("fillAppliedMsg");
const fillAppliedOpenBtn = document.getElementById("fillAppliedOpenBtn");

let serverUrl = "";
let pageTitle = "";
let closeTimer = null;
let currentTab = null;

const SCREENS = {
  setup: setupEl,
  form: formEl,
  success: successEl,
  inbox: inboxStateEl,
  saved: savedStateEl,
  filling: fillFillingEl,
  review: fillReviewEl,
  applied: fillAppliedEl,
};

// Taxonomy match-or-create resolver + summary helpers, loaded from taxonomyFill.js (a classic
// script included before this one in popup.html). `TAX_PATCH_KEY` maps each taxonomy kind to its
// PATCH id-array field / stub endpoint.
const {
  TAX_PATCH_KEY,
  resolveTaxonomyId,
  summarizeCreated,
  summarizeFailed,
} = globalThis.eesimpleTaxonomyFill;
// Custom-property types the popup can fill, mapped to the bookmark's typed value array / PATCH key.
// itemInItems (Two Numbers) and choices fill a single rule-selected sub-value (target.subField /
// target.choiceValue). Other value kinds (sections/ratingScale/…) degrade to a disabled
// "unsupported" row.
const VALUE_PATCH_KEY = {
  number: "numberValues",
  boolean: "booleanValues",
  text: "textValues",
  datetime: "dateTimeValues",
  itemInItems: "progressValues",
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
//   unknown / fetch failure → today's quick-save-to-inbox flow (never regress saving)
//   inbox                   → "already in your inbox"
//   bookmark + rules        → fill mode (scrape the page, review, apply)
//   bookmark + no rules      → "already saved"
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

async function bootFillContext(url) {
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
  routeByMode(ctx, url);
}

// Show the editable add form with both choices (Add to Inbox / Add as Bookmark) instead of
// auto-saving, so the user picks whether this page bypasses the Inbox. The URL is pre-filled from
// the active tab (initForm), so it's still one click either way.
function quickSaveFallback() {
  show("form");
}

function routeByMode(ctx, url) {
  if (!ctx || ctx.mode === "unknown") {
    quickSaveFallback();
    return;
  }
  if (ctx.mode === "inbox") {
    renderInbox();
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
  // Unexpected mode — stay safe and save.
  quickSaveFallback();
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

function renderInbox() {
  inboxViewBtn.onclick = () => {
    chrome.tabs.create({
      url: `${serverUrl}/inbox`,
    });
    window.close();
  };
  show("inbox");
}

function renderSaved(bookmark) {
  savedOpenBtn.onclick = () => openBookmark(bookmark?.id);
  show("saved");
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
      onSuccess("Queued in Inbox.");
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
      onBookmarkSuccess("Added as bookmark.", data && data.id);
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

// --- Fill mode ----------------------------------------------------------
async function enterFillMode(ctx, rules) {
  const bookmark = ctx.bookmark;
  fillFillingTitle.textContent = bookmark?.title ?? "";
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
      return buildRow(rule, result?.values ?? [], ctx);
    });
  }
  catch {
    // A malformed rule/result shouldn't leave the popup stuck on the "Reading the page…" spinner.
    showReviewError(bookmark, "Couldn't prepare the changes for this page.");
    return;
  }
  renderReview(bookmark, rows);
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
  fillReviewTitle.textContent = bookmark?.title ?? "";
  fillError.textContent = message;
  fillError.classList.remove("hidden");
  fillRows.innerHTML = "";
  fillApplyBtn.classList.add("hidden");
  fillReviewOpenBtn.onclick = () => openBookmark(bookmark?.id);
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

function buildRow(rule, values, ctx) {
  const kind = rule.target?.kind;
  if (kind === "field") return buildFieldRow(rule, values, ctx.bookmark);
  if (kind === "customProperty") return buildPropertyRow(rule, values, ctx);
  if (kind === "taxonomy") return buildTaxonomyRow(rule, values, ctx);
  if (kind === "image") return buildImageRow(rule, values, ctx.bookmark);
  return baseRow(rule, "", values[0] ?? "", false, "unsupported");
}

// image: grab image URL(s) off the page (resolved to absolute against the tab URL) and, on apply,
// download the bytes in the browser and upload them to the bookmark. `setMain` makes the first
// grabbed image the bookmark's main image. Non-http(s) values (e.g. data: URIs) are dropped.
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

// Resolve an extracted value to an absolute http(s) URL against the current tab, or null if it
// isn't a usable remote image URL.
function resolveImageUrl(value) {
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
  const extracted = values[0] ?? "";
  if (!property || !patchKey) {
    return baseRow(rule, "", extracted, false, "unsupported");
  }
  if (!extracted) {
    return baseRow(rule, "", "", false, "not found");
  }
  if (property.type === "itemInItems") {
    return buildProgressRow(rule, property, extracted, bookmark);
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
function renderReview(bookmark, rows) {
  fillReviewTitle.textContent = bookmark?.title ?? "";
  fillError.classList.add("hidden");
  fillError.textContent = "";
  fillApplyBtn.classList.remove("hidden");
  fillApplyBtn.disabled = false;
  fillApplyBtn.textContent = "Apply";
  fillRows.innerHTML = "";
  for (const row of rows) {
    fillRows.appendChild(renderRow(row));
  }
  fillReviewOpenBtn.onclick = () => openBookmark(bookmark?.id);
  fillApplyBtn.onclick = () => void applyChanges(rows, bookmark);
  show("review");
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

  const valuesEl = document.createElement("div");
  valuesEl.className = "fill-values";
  if (row.currentText) {
    const cur = document.createElement("span");
    cur.className = "fill-current";
    cur.textContent = row.currentText;
    valuesEl.appendChild(cur);
    const arrow = document.createElement("span");
    arrow.className = "fill-arrow";
    arrow.textContent = " → ";
    valuesEl.appendChild(arrow);
  }
  if (row.extractedNames) {
    appendNames(valuesEl, row.extractedNames, row.newNames);
  }
  else {
    const ext = document.createElement("span");
    ext.className = "fill-extracted";
    ext.textContent = row.extractedText || "(not found)";
    valuesEl.appendChild(ext);
  }
  body.appendChild(valuesEl);

  wrap.appendChild(body);
  return wrap;
}

function appendNames(container, names, newNames) {
  const newLower = new Set((newNames || []).map(n => n.toLowerCase()));
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
  });
}

// --- Apply --------------------------------------------------------------
async function applyChanges(rows, bookmark) {
  const checked = rows.filter(row => row.checkbox && row.checkbox.checked);
  const imageRows = checked.filter(row => row.image);
  const patchRows = checked.filter(row => !row.image);
  fillApplyBtn.disabled = true;
  fillApplyBtn.textContent = "Applying…";
  fillError.classList.add("hidden");

  // Accumulators shared across rows: taxonomy id sets (unioned with existing), custom-property value
  // maps (seeded from existing so siblings aren't wiped), per-kind hydration flags (the wipe guard),
  // and the created / failed taxonomy names for the post-apply summary.
  const state = {
    tax: {},
    values: {},
    taxHydrated: {},
    created: [],
    failed: [],
  };
  const patch = {};

  try {
    for (const row of patchRows) {
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

    // Only PATCH when there's something to change (a run of only image rows skips it).
    if (Object.keys(patch).length > 0) {
      const res = await fetch(`${serverUrl}/api/bookmarks/${bookmark.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
    }

    // Image uploads run after the PATCH (best-effort): the browser downloads each grabbed image and
    // uploads the bytes to the bookmark. A failure here surfaces a note but doesn't undo the PATCH.
    const imageResult = await applyImageRows(imageRows, bookmark.id);

    const n = patchRows.length + imageResult.uploaded;
    let message = `Updated ${n} field${n === 1 ? "" : "s"}.`;
    // Note freshly-created taxonomy stubs, then any that couldn't be created (best-effort: a taxonomy
    // failure doesn't undo the rest of the PATCH, but it must never be silently swallowed).
    if (state.created.length > 0) {
      message += ` ${summarizeCreated(state.created)}`;
    }
    if (state.failed.length > 0) {
      message += ` ${summarizeFailed(state.failed)}`;
    }
    if (imageResult.failed > 0) {
      message += ` ${imageResult.failed} image${imageResult.failed === 1 ? "" : "s"} couldn't be saved.`;
    }
    fillAppliedMsg.textContent = message;
    fillAppliedOpenBtn.onclick = () => openBookmark(bookmark.id);
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
