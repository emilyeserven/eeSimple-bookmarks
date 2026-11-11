import type { PendingSelector } from "../lib/picker/pendingSelector";
import type { ExtensionFillContext, FillTarget, WebsiteExtensionFillRule } from "@eesimple/types";

import { SECTION_ENTRY_TYPES } from "@eesimple/types";
import { browser } from "wxt/browser";

import { apiGet, sendJson } from "./api";
import { cancelCountdown } from "./countdown";
import { els, show } from "./dom";
import { randomId } from "./fill/format";
import { openServerPage, session } from "./session";
import { PENDING_SELECTOR_KEY } from "../lib/picker/pendingSelector";

/*
 * "Find a selector": the button injects the in-page picker and closes the popup (an MV3 action popup
 * dies the moment the page takes focus). The picker writes its pick to storage; the next popup open
 * finds it (`readPendingSelector`) and lands on the prefill screen to create the draft rule.
 */

const SELECTOR_TTL_MS = 15 * 60 * 1000;

/**
 * Pages an extension genuinely can't script: browser-internal schemes and the Web Store. Used to show
 * the "browser or store page" message only when true, so a real injection failure keeps its own error.
 */
export function isRestrictedUrl(url: string | undefined): boolean {
  if (!url) return true;
  if (/^(?:chrome|chrome-extension|chrome-untrusted|edge|brave|about|view-source|devtools|data|moz-extension|file):/i.test(url)) {
    return true;
  }
  return /^https:\/\/(?:chromewebstore\.google\.com|chrome\.google\.com\/webstore)/i.test(url);
}

/** Offer the button on any injectable page (a website record is created on demand at rule creation). */
export function wireFindSelectorButton(btn: HTMLButtonElement, statusEl: HTMLElement): void {
  const tab = session.currentTab;
  btn.classList.toggle("hidden", tab?.id == null || isRestrictedUrl(tab.url));
  statusEl.textContent = "";
  btn.onclick = () => void startSelectorPicker(statusEl);
}

/** Load the picker (+ the engine, for its value preview), then start it. */
async function injectPicker(tabId: number): Promise<void> {
  await browser.scripting.executeScript({
    target: {
      tabId,
    },
    files: ["/fillEngine.js", "/selectorPicker.js"],
  });
  await browser.scripting.executeScript({
    target: {
      tabId,
    },
    func: () => {
      if (!globalThis.eesimpleSelectorPicker) throw new Error("selectorPicker.js did not load");
      globalThis.eesimpleSelectorPicker.start();
    },
  });
}

async function startSelectorPicker(statusEl: HTMLElement): Promise<void> {
  const tab = session.currentTab;
  if (tab?.id == null) return;
  cancelCountdown();
  if (isRestrictedUrl(tab.url)) {
    statusEl.textContent = "Can't scan this page (a browser or store page).";
    return;
  }
  try {
    await injectPicker(tab.id);
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    statusEl.textContent = /could not load file/i.test(message)
      ? "Extension out of date — reload it at chrome://extensions."
      : `Couldn't start the picker: ${message}`;
    return;
  }
  window.close();
}

/** Compare origin+path only — the picked-page URL may carry a different hash/query than the tab URL. */
function sameUrlIsh(a: string | undefined, b: string): boolean {
  if (!a || !b) return false;
  const strip = (u: string) => {
    try {
      const parsed = new URL(u);
      return parsed.origin + parsed.pathname;
    }
    catch {
      return u.split("#")[0];
    }
  };
  return strip(a) === strip(b);
}

/** The picker's stored pick for this page, if fresh. */
export async function readPendingSelector(url: string): Promise<PendingSelector | null> {
  const data = await browser.storage.local.get(PENDING_SELECTOR_KEY);
  const pending = data[PENDING_SELECTOR_KEY] as PendingSelector | undefined;
  if (!pending?.selector) return null;
  if (Date.now() - (pending.ts ?? 0) > SELECTOR_TTL_MS || !sameUrlIsh(pending.url, url)) return null;
  return pending;
}

function clearPendingSelector(): Promise<void> {
  return browser.storage.local.remove(PENDING_SELECTOR_KEY);
}

// --- Prefill screen -------------------------------------------------------
/** One option of the target `<select>`. */
type PrefillSpec
  = | { value: string;
    label: string;
    kind: "sections";
    propertyId: string; }
    | { value: string;
      label: string;
      kind: "field";
      field: Extract<FillTarget, { kind: "field" }>["field"]; }
      | { value: string;
        label: string;
        kind: "customProperty";
        propertyId: string; };

let prefillSpecs: PrefillSpec[] = [];

function summaryLine(label: string, value: string): HTMLDivElement {
  const line = document.createElement("div");
  const name = document.createElement("span");
  name.className = "fill-label";
  name.textContent = `${label}:`;
  const code = document.createElement("code");
  code.textContent = value;
  line.append(name, " ", code);
  return line;
}

function noteLine(text: string): HTMLDivElement {
  const line = document.createElement("div");
  line.className = "fill-note";
  line.textContent = text;
  return line;
}

function buildPrefillSummary(pending: PendingSelector): HTMLDivElement[] {
  if (pending.mode === "section") {
    const s = pending.section;
    const lines = [summaryLine("Item", s?.itemSelector ?? pending.selector)];
    if (s?.itemName) lines.push(summaryLine("Name", s.itemName));
    if (s?.itemUrl) lines.push(summaryLine("Link", s.itemUrl));
    if (s?.sectionHeaderSelector) lines.push(summaryLine("Header", s.sectionHeaderSelector));
    return lines;
  }
  const lines = [summaryLine("Selector", pending.selector)];
  if (pending.mode === "list" || pending.mode === "generalize") {
    lines.push(noteLine(`Matches ${pending.matchCount ?? "?"} elements`));
  }
  if (pending.sampleValue) lines.push(noteLine(`Sample: ${pending.sampleValue}`));
  return lines;
}

async function resolveSectionsPropertyId(): Promise<string | null> {
  try {
    const res = await apiGet("/api/custom-properties");
    if (!res.ok) return null;
    const props = await res.json() as { id: string;
      slug?: string; }[];
    return props.find(prop => prop.slug === "sections")?.id ?? null;
  }
  catch {
    return null;
  }
}

const FIELD_SPECS: PrefillSpec[] = [
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

/**
 * The target options. A section pick needs the built-in Sections property id (fetched — it isn't in
 * `ctx.properties` unless a sections rule exists); other picks offer the four fields + each property.
 */
async function buildPrefillTargets(ctx: ExtensionFillContext, pending: PendingSelector): Promise<PrefillSpec[]> {
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
  return [
    ...FIELD_SPECS,
    ...(ctx.properties ?? []).map((prop): PrefillSpec => ({
      value: `prop:${prop.id}`,
      label: `Property: ${prop.name}`,
      kind: "customProperty",
      propertyId: prop.id,
    })),
  ];
}

function selectedEntryType(): (typeof SECTION_ENTRY_TYPES)[number] {
  const value = els.prefillEntryType.value;
  return (SECTION_ENTRY_TYPES as readonly string[]).includes(value) ? value as (typeof SECTION_ENTRY_TYPES)[number] : "name";
}

/** A schema-clean draft rule — only fields the server's `additionalProperties: false` schema allows. */
function buildDraftRule(pending: PendingSelector, label: string, spec: PrefillSpec): WebsiteExtensionFillRule {
  const id = randomId();
  if (spec.kind === "sections") {
    const s = pending.section;
    const target: Extract<FillTarget, { kind: "sections" }> = {
      kind: "sections",
      propertyId: spec.propertyId,
      entryType: selectedEntryType(),
    };
    if (s?.container) target.container = s.container;
    if (s?.itemName) target.itemName = s.itemName;
    if (s?.itemUrl) {
      target.itemUrl = s.itemUrl;
      target.resolveItemUrl = true;
    }
    if (s?.sectionHeaderSelector) target.sectionHeaderSelector = s.sectionHeaderSelector;
    return {
      id,
      label,
      target,
      extract: {
        selector: s?.itemSelector || pending.selector,
      },
    };
  }
  const target: FillTarget = spec.kind === "field"
    ? {
      kind: "field",
      field: spec.field,
    }
    : {
      kind: "customProperty",
      propertyId: spec.propertyId,
    };
  const rule: WebsiteExtensionFillRule = {
    id,
    label,
    target,
    extract: {
      selector: pending.selector,
    },
  };
  if (pending.read && pending.read.kind !== "text") rule.extract.read = pending.read;
  return rule;
}

type WebsiteForRule = Pick<NonNullable<ExtensionFillContext["website"]>, "id" | "slug" | "extensionFillRules">;

/** Look up (or create, by domain) the website for a URL so a rule can be attached. */
async function resolveWebsiteForUrl(url: string | undefined): Promise<WebsiteForRule | null> {
  if (!url) return null;
  try {
    const res = await sendJson("POST", "/api/websites/resolve", {
      url,
    });
    if (!res.ok) return null;
    const website = await res.json() as Partial<WebsiteForRule>;
    return website.id && website.slug
      ? {
        id: website.id,
        slug: website.slug,
        extensionFillRules: website.extensionFillRules ?? [],
      }
      : null;
  }
  catch {
    return null;
  }
}

function prefillFailed(message: string): void {
  els.prefillCreateBtn.disabled = false;
  els.prefillCreateBtn.textContent = "Create draft rule & open editor";
  els.prefillError.textContent = message;
}

async function createDraftRuleAndOpenEditor(ctx: ExtensionFillContext, pending: PendingSelector): Promise<void> {
  els.prefillError.textContent = "";
  const spec = prefillSpecs.find(s => s.value === els.prefillTarget.value);
  if (!spec) {
    els.prefillError.textContent = "Pick where to put the value.";
    return;
  }
  const rule = buildDraftRule(pending, els.prefillLabel.value.trim() || "New rule", spec);
  els.prefillCreateBtn.disabled = true;
  els.prefillCreateBtn.textContent = "Creating…";
  const website = ctx.website ?? await resolveWebsiteForUrl(pending.url);
  if (!website) {
    prefillFailed("Couldn't find or create a website for this page.");
    return;
  }
  try {
    const res = await sendJson("PATCH", `/api/websites/${website.id}`, {
      extensionFillRules: [...website.extensionFillRules, rule],
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
  }
  catch (err) {
    prefillFailed(`Couldn't save the rule (${err instanceof Error ? err.message : String(err)}).`);
    return;
  }
  await clearPendingSelector();
  openServerPage(`/taxonomies/websites/${website.slug}/edit?tab=extension-fill&rule=${rule.id}`);
}

/**
 * Land on the prefill screen for a pick. `onDiscard` re-routes the popup normally (passed in to keep
 * this module free of the router).
 */
export async function showSelectorPrefill(ctx: ExtensionFillContext, pending: PendingSelector, onDiscard: () => void): Promise<void> {
  els.prefillError.textContent = "";
  els.prefillLabel.value = pending.label || "New rule";
  els.prefillSummary.replaceChildren(...buildPrefillSummary(pending));
  els.prefillEntryType.classList.toggle("hidden", pending.mode !== "section");

  prefillSpecs = await buildPrefillTargets(ctx, pending);
  els.prefillTarget.replaceChildren(...prefillSpecs.map((spec) => {
    const opt = document.createElement("option");
    opt.value = spec.value;
    opt.textContent = spec.label;
    return opt;
  }));
  const empty = prefillSpecs.length === 0;
  els.prefillTarget.disabled = empty;
  els.prefillCreateBtn.disabled = empty;
  if (empty) {
    els.prefillError.textContent = pending.mode === "section"
      ? "Couldn't find the Sections property on the server."
      : "No target field was available.";
  }
  els.prefillCreateBtn.onclick = () => void createDraftRuleAndOpenEditor(ctx, pending);
  els.prefillDiscardBtn.onclick = () => {
    void clearPendingSelector().then(onDiscard);
  };
  show("selectorPrefill");
}
