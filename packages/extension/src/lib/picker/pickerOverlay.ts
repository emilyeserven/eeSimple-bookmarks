import type { PendingSelector, PickedSection, PickerMode } from "./pendingSelector";
import type { FillRead } from "../fill/fillExtract";

import { browser } from "wxt/browser";

import { PENDING_SELECTOR_KEY } from "./pendingSelector";
import {
  buildCommonSelector,
  buildExactSelector,
  buildGeneralSelector,
  buildRelativeSelector,
  buildRobustSelector,
  defaultRead,
  sampleValueFor,
} from "./selectorGenerators";

/*
 * The in-page "Find a selector" overlay: a hover highlight, a fixed toolbar (mode switch + status +
 * confirm/cancel), and the per-mode pick handlers. Injected by the popup as the `/selectorPicker.js`
 * unlisted script; it runs standalone in the page (the popup closes as soon as the page takes focus)
 * and writes the chosen selector(s) to `storage.local` for the popup's next open.
 */

type SectionStep = "items" | "name" | "url" | "header";

/** The result of a Single / List / Generalize pick, awaiting "Use this". */
interface PickResult {
  mode: Exclude<PickerMode, "section">;
  selector: string;
  matchCount: number;
  read?: FillRead | null;
  unique?: boolean;
  container?: string | null;
  sampleValue?: string;
}

interface PickerState {
  mode: PickerMode;
  picks: Element[];
  result?: PickResult;
  section: PickedSection & { step: SectionStep };
}

interface PickerUi {
  highlight: HTMLDivElement;
  bar: HTMLDivElement;
  status: HTMLDivElement;
  modeButtons: HTMLDivElement;
  useBtn: HTMLButtonElement;
  nextBtn: HTMLButtonElement;
  marks: HTMLDivElement[];
  state: PickerState;
}

declare global {

  var __eesimpleSelectorPickerActive: boolean | undefined;
}

const MODE_LABELS: Record<PickerMode, string> = {
  single: "Single",
  list: "List",
  section: "Section",
  generalize: "Generalize",
};

let ui: PickerUi | null = null;

function freshState(mode: PickerMode): PickerState {
  return {
    mode,
    picks: [],
    section: {
      step: "items",
      itemSelector: "",
      container: "",
      itemName: "",
      itemUrl: "",
      resolveItemUrl: false,
      sectionHeaderSelector: "",
    },
  };
}

function escapeHtml(str: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
  };
  return String(str).replace(/[&<>"]/g, c => entities[c] ?? c);
}

function box(styles: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = styles;
  return el;
}

function positionOver(marker: HTMLElement, target: Element): void {
  const r = target.getBoundingClientRect();
  marker.style.top = `${r.top + window.scrollY}px`;
  marker.style.left = `${r.left + window.scrollX}px`;
  marker.style.width = `${r.width}px`;
  marker.style.height = `${r.height}px`;
}

function clearMarks(current: PickerUi): void {
  for (const m of current.marks) m.remove();
  current.marks = [];
}

/** Paint a persistent outline over every element a selector matches (the "matches N" preview). */
function highlightMatches(current: PickerUi, selector: string): number {
  clearMarks(current);
  let found: NodeListOf<Element>;
  try {
    found = document.querySelectorAll(selector);
  }
  catch {
    return 0;
  }
  found.forEach((el) => {
    const m = box("position:absolute;z-index:2147483646;pointer-events:none;border:2px solid #16a34a;"
      + "background:rgba(22,163,74,0.12);box-sizing:border-box;");
    document.body.appendChild(m);
    positionOver(m, el);
    current.marks.push(m);
  });
  return found.length;
}

function setStatus(html: string): void {
  if (ui) ui.status.innerHTML = html;
}

function code(value: string): string {
  return `<code>${escapeHtml(value)}</code>`;
}

function suggestLabel(value: string | undefined): string {
  const v = (value ?? "").replace(/\s+/g, " ").trim();
  return v ? v.slice(0, 40) : "New rule";
}

export function teardown(): void {
  if (!ui) return;
  document.removeEventListener("mousemove", onMove, true);
  document.removeEventListener("click", onClick, true);
  document.removeEventListener("keydown", onKey, true);
  ui.highlight.remove();
  for (const m of ui.marks) m.remove();
  ui.bar.remove();
  globalThis.__eesimpleSelectorPickerActive = false;
  ui = null;
}

function persistAndClose(result: PendingSelector): void {
  const stored: PendingSelector = {
    ...result,
    ts: Date.now(),
    url: location.href,
  };
  browser.storage.local.set({
    [PENDING_SELECTOR_KEY]: stored,
  }).then(() => {
    setStatus("Saved. Reopen the eeSimple popup to finish creating the rule.");
    setTimeout(teardown, 2500);
  }, () => {
    setStatus("Couldn't reach extension storage.");
  });
}

function elementFromPoint(x: number, y: number): Element | null {
  const el = document.elementFromPoint(x, y);
  if (el && ui && (el === ui.bar || ui.bar.contains(el))) return null;
  return el;
}

const BUTTON_STYLE = "padding:6px 10px;border:0;border-radius:6px;cursor:pointer;font:12px system-ui;";

function button(label: string, styles: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement("button");
  b.textContent = label;
  b.style.cssText = styles;
  b.onclick = onClick;
  return b;
}

/** Build the fixed toolbar (mode switch + status + confirm/cancel). */
function buildBar(): Omit<PickerUi, "highlight" | "marks" | "state"> {
  const bar = box("position:fixed;z-index:2147483647;left:50%;transform:translateX(-50%);bottom:16px;"
    + "max-width:92vw;background:#111827;color:#f9fafb;font:13px/1.4 system-ui,sans-serif;"
    + "padding:10px 12px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,0.4);");
  // Keep toolbar clicks off the page underneath, in the BUBBLE phase: a capture-phase stopPropagation
  // would halt the event before it reached the buttons' own `onclick` handlers. The document-level pick
  // handler already ignores toolbar clicks (elementFromPoint returns null inside the bar).
  bar.addEventListener("click", e => e.stopPropagation(), false);

  const modes = box("display:flex;gap:6px;margin-bottom:8px;");
  for (const mode of Object.keys(MODE_LABELS) as PickerMode[]) {
    const b = button(MODE_LABELS[mode], "flex:1;padding:4px 8px;border:0;border-radius:6px;cursor:pointer;"
      + "background:#374151;color:#f9fafb;font:12px system-ui;", () => setMode(mode));
    b.dataset.mode = mode;
    modes.appendChild(b);
  }

  const status = box("margin:6px 0;min-height:18px;");
  const actions = box("display:flex;gap:6px;margin-top:8px;");
  const useBtn = button("Use this", `flex:1;${BUTTON_STYLE}background:#2563eb;color:#fff;`, confirmCurrent);
  const nextBtn = button("Next", `flex:1;${BUTTON_STYLE}background:#059669;color:#fff;`, advanceSection);
  const cancelBtn = button("Cancel", `${BUTTON_STYLE}background:#4b5563;color:#f9fafb;`, teardown);
  actions.append(useBtn, nextBtn, cancelBtn);
  bar.append(modes, status, actions);
  document.body.appendChild(bar);
  return {
    bar,
    status,
    modeButtons: modes,
    useBtn,
    nextBtn,
  };
}

function refreshModeButtons(): void {
  if (!ui) return;
  const state = ui.state;
  for (const b of Array.from(ui.modeButtons.children) as HTMLElement[]) {
    b.style.background = b.dataset.mode === state.mode ? "#2563eb" : "#374151";
  }
  const sectioning = state.mode === "section" && !!state.section.itemSelector;
  ui.nextBtn.style.display = state.mode === "section" ? "" : "none";
  ui.useBtn.textContent = sectioning ? "Finish" : "Use this";
}

const MODE_PROMPTS: Record<PickerMode, string> = {
  single: "Click an element to capture its selector.",
  list: "Click each element to include, then \"Use this\".",
  generalize: "Click 1+ example elements; a general pattern matching all similar elements is built.",
  section: "Section: click 2+ example ITEMS (rows), then \"Next\".",
};

function setMode(mode: PickerMode): void {
  if (!ui) return;
  ui.state = freshState(mode);
  clearMarks(ui);
  refreshModeButtons();
  setStatus(MODE_PROMPTS[mode]);
}

function onMove(e: MouseEvent): void {
  if (!ui) return;
  const el = elementFromPoint(e.clientX, e.clientY);
  if (!el) return;
  positionOver(ui.highlight, el);
  ui.highlight.style.display = "block";
}

function onKey(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    e.preventDefault();
    teardown();
  }
}

function onClick(e: MouseEvent): void {
  if (!ui) return;
  const el = elementFromPoint(e.clientX, e.clientY);
  if (!el) return;
  e.preventDefault();
  e.stopPropagation();
  PICK_HANDLERS[ui.state.mode](ui, el);
}

function handleSinglePick(current: PickerUi, el: Element): void {
  const read = defaultRead(el);
  const result = buildRobustSelector(el, document);
  const sampleValue = sampleValueFor(result.selector, read, document);
  current.state.result = {
    mode: "single",
    selector: result.selector,
    read: read.kind === "text" ? null : read,
    unique: result.unique,
    matchCount: result.matchCount,
    sampleValue,
  };
  highlightMatches(current, result.selector);
  setStatus(`Selector: ${code(result.selector)}<br>Sample: ${escapeHtml(sampleValue || "(empty)")}`
    + (result.unique ? "" : ` &middot; ⚠ matches ${result.matchCount}`)
    + "<br>Click \"Use this\" or pick another element.");
}

function addPick(current: PickerUi, el: Element): void {
  if (!current.state.picks.includes(el)) current.state.picks.push(el);
}

function handleListPick(current: PickerUi, el: Element): void {
  addPick(current, el);
  const exact = buildExactSelector(current.state.picks, document);
  current.state.result = {
    mode: "list",
    selector: exact.selector,
    matchCount: exact.matchCount,
  };
  const n = highlightMatches(current, exact.selector);
  setStatus(`Selector: ${code(exact.selector)}<br>Matches ${n} element(s) — your ${current.state.picks.length} selection(s)`
    + (exact.exact ? "" : " &middot; ⚠ also matches others")
    + "<br>Click more elements to add, then \"Use this\".");
}

function handleGeneralizePick(current: PickerUi, el: Element): void {
  addPick(current, el);
  const read = defaultRead(el);
  const general = buildGeneralSelector(current.state.picks, document);
  const sampleValue = sampleValueFor(general.selector, read, document);
  current.state.result = {
    mode: "generalize",
    selector: general.selector,
    read: read.kind === "text" ? null : read,
    matchCount: general.matchCount,
    container: general.container ?? null,
    sampleValue,
  };
  const n = highlightMatches(current, general.selector);
  const scopeNote = general.container ? ` &middot; scoped to ${code(general.container)}` : "";
  setStatus(`Selector: ${code(general.selector)}<br>Matches ${n} element(s) — general pattern${scopeNote}`
    + `<br>Sample: ${escapeHtml(sampleValue || "(empty)")}`
    + "<br>Add another example to refine, then \"Use this\".");
}

function itemRootFor(section: PickedSection, el: Element): Element | null {
  if (!section.itemSelector) return null;
  try {
    return el.closest(section.itemSelector);
  }
  catch {
    return null;
  }
}

/** Section step 1: collect example items and generalize them into the item selector. */
function pickSectionItem(current: PickerUi, el: Element): void {
  const s = current.state.section;
  current.state.picks.push(el);
  const common = buildCommonSelector(current.state.picks, document);
  s.itemSelector = common.selector;
  s.container = common.container ?? "";
  const n = highlightMatches(current, s.itemSelector);
  setStatus(`Item selector: ${code(s.itemSelector)}<br>Matches ${n} item(s). `
    + "Click more example rows to refine, then \"Next\" to pick the name.");
}

function handleSectionPick(current: PickerUi, el: Element): void {
  const s = current.state.section;
  if (s.step === "items") {
    pickSectionItem(current, el);
    return;
  }
  if (s.step === "header") {
    const head = buildRobustSelector(el, document);
    s.sectionHeaderSelector = head.selector;
    setStatus(`Group header: ${code(head.selector)}<br>Click "Finish".`);
    return;
  }
  const root = itemRootFor(s, el);
  if (!root) {
    setStatus("Click inside one of the highlighted items.");
    return;
  }
  const rel = buildRelativeSelector(root, el);
  if (s.step === "name") {
    s.itemName = rel.selector;
    setStatus(`Item name: ${code(rel.selector)} (e.g. "${escapeHtml((el.textContent ?? "").trim().slice(0, 30))}")`
      + "<br>\"Next\" to pick the link, or \"Finish\".");
    return;
  }
  s.itemUrl = rel.selector;
  s.resolveItemUrl = true;
  setStatus(`Item link: ${code(rel.selector)}<br>"Next" for a group header, or "Finish".`);
}

const PICK_HANDLERS: Record<PickerMode, (current: PickerUi, el: Element) => void> = {
  single: handleSinglePick,
  list: handleListPick,
  generalize: handleGeneralizePick,
  section: handleSectionPick,
};

function advanceSection(): void {
  if (!ui) return;
  const s = ui.state.section;
  if (s.step === "items") {
    if (!s.itemSelector) {
      setStatus("Pick at least 2 example items first.");
      return;
    }
    s.step = "name";
    clearMarks(ui);
    setStatus("Click the NAME element inside one highlighted item.");
    highlightMatches(ui, s.itemSelector);
  }
  else if (s.step === "name") {
    s.step = "url";
    setStatus("Click the LINK element inside one item (or \"Finish\" to skip).");
  }
  else if (s.step === "url") {
    s.step = "header";
    setStatus("Click a GROUP HEADER element (or \"Finish\" to skip).");
  }
  refreshModeButtons();
}

function confirmSection(s: PickerState["section"]): void {
  if (!s.itemSelector) {
    setStatus("Pick the example items first.");
    return;
  }
  persistAndClose({
    mode: "section",
    selector: s.itemSelector,
    section: {
      itemSelector: s.itemSelector,
      container: s.container,
      itemName: s.itemName,
      itemUrl: s.itemUrl,
      resolveItemUrl: s.resolveItemUrl,
      sectionHeaderSelector: s.sectionHeaderSelector,
    },
    label: "Sections",
  });
}

function confirmCurrent(): void {
  if (!ui) return;
  if (ui.state.mode === "section") {
    confirmSection(ui.state.section);
    return;
  }
  const r = ui.state.result;
  if (!r?.selector) {
    setStatus("Pick an element first.");
    return;
  }
  persistAndClose({
    mode: r.mode,
    selector: r.selector,
    read: r.read ?? null,
    sampleValue: r.sampleValue ?? "",
    matchCount: r.matchCount,
    label: suggestLabel(r.sampleValue),
  });
}

/** Mount the overlay (idempotent while one is already active). */
export function start(): void {
  if (globalThis.__eesimpleSelectorPickerActive) return;
  globalThis.__eesimpleSelectorPickerActive = true;
  const highlight = box("position:absolute;z-index:2147483645;pointer-events:none;border:2px solid #2563eb;"
    + "background:rgba(37,99,235,0.12);box-sizing:border-box;display:none;");
  document.body.appendChild(highlight);
  ui = {
    ...buildBar(),
    highlight,
    marks: [],
    state: freshState("single"),
  };
  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);
  refreshModeButtons();
  setStatus(MODE_PROMPTS.single);
}
