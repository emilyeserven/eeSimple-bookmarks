import type { FillRow } from "./rowTypes";
import type { SectionDiffItem } from "./sections";
import type { ExtensionFillRuleGroup } from "@eesimple/types";

import { entityAllTermsDisplay, entityDisplayForTerm } from "./entityDisplay";
import { plural } from "./format";
import { ALL_TERMS } from "./rowTypes";

/*
 * DOM rendering for the review screen: one checkbox row per rule, bucketed under collapsible rule
 * groups. Rendering sets each row's `checkbox`, which `applyChanges` reads.
 */

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** A collapsible group section, expanded by default. `<summary>` never toggles a row checkbox. */
function makeGroupDetails(label: string, isChild: boolean): HTMLDetailsElement {
  const details = el("details", isChild ? "fill-group fill-group-child" : "fill-group");
  details.open = true;
  details.appendChild(el("summary", "fill-group-header", label || "(unnamed group)"));
  return details;
}

/**
 * Render rows bucketed by their rule group (two tiers), ungrouped rows flat. Every row renders exactly
 * once — a leftover pass catches ungrouped, stale-groupId, and orphaned-child rows.
 */
export function appendGroupedRows(container: HTMLElement, rows: readonly FillRow[], groups: readonly ExtensionFillRuleGroup[]): void {
  const rendered = new Set<FillRow>();
  const rowsForGroup = (id: string) => rows.filter(r => r.rule.groupId === id);
  const render = (target: HTMLElement, row: FillRow) => {
    target.appendChild(renderRow(row));
    rendered.add(row);
  };
  for (const top of groups.filter(g => !g.parentId)) {
    const childSets = groups
      .filter(g => g.parentId === top.id)
      .map(group => ({
        group,
        rows: rowsForGroup(group.id),
      }))
      .filter(set => set.rows.length > 0);
    const ownRows = rowsForGroup(top.id);
    if (ownRows.length === 0 && childSets.length === 0) continue;
    const details = makeGroupDetails(top.label, false);
    for (const row of ownRows) render(details, row);
    for (const set of childSets) {
      const childDetails = makeGroupDetails(set.group.label, true);
      for (const row of set.rows) render(childDetails, row);
      details.appendChild(childDetails);
    }
    container.appendChild(details);
  }
  for (const row of rows) {
    if (!rendered.has(row)) container.appendChild(renderRow(row));
  }
}

function renderLabel(row: FillRow): HTMLDivElement {
  const label = el("div", "fill-label", row.label);
  if (row.disabledReason) label.appendChild(el("span", "fill-note", ` — ${row.disabledReason}`));
  return label;
}

interface ValueSpans {
  current: HTMLSpanElement | null;
  extracted: HTMLSpanElement | null;
}

function renderValues(row: FillRow, spans: ValueSpans): HTMLDivElement {
  const valuesEl = el("div", "fill-values");
  if (row.currentText) {
    spans.current = el("span", "fill-current", row.currentText);
    valuesEl.append(spans.current, el("span", "fill-arrow", " → "));
  }
  if (row.extractedNames) {
    appendNames(valuesEl, row.extractedNames, row.newNames, row.unmatchedNames ?? []);
  }
  else {
    spans.extracted = el("span", "fill-extracted", row.extractedText || "(not found)");
    valuesEl.appendChild(spans.extracted);
  }
  return valuesEl;
}

/** Re-read a multi-term entity row after the term picker changes, refreshing its text + checkbox. */
function refreshEntityRow(row: FillRow, spans: ValueSpans): void {
  const entity = row.entity;
  if (!entity) return;
  const term = entity.terms.find(t => t.id === entity.selectedTermId);
  const display = entity.selectedTermId === ALL_TERMS || !term
    ? entityAllTermsDisplay(entity)
    : entityDisplayForTerm(entity, term);
  row.currentText = display.currentText;
  row.changed = display.changed;
  if (spans.current) spans.current.textContent = display.currentText;
  // A relation row renders extracted names (no extractedText); only refresh it when present.
  if (display.extractedText !== undefined) {
    row.extractedText = display.extractedText;
    if (spans.extracted) spans.extracted.textContent = display.extractedText || "(not found)";
  }
  if (row.checkbox) row.checkbox.checked = display.changed;
}

function renderRow(row: FillRow): HTMLLabelElement {
  const wrap = el("label", row.disabledReason ? "fill-row disabled" : "fill-row");
  const cb = el("input");
  cb.type = "checkbox";
  cb.checked = row.changed && !row.disabledReason;
  cb.disabled = !!row.disabledReason;
  row.checkbox = cb;
  wrap.appendChild(cb);

  const body = el("div", "fill-body");
  body.appendChild(renderLabel(row));
  const spans: ValueSpans = {
    current: null,
    extracted: null,
  };
  // A taxonomyEntity row linked to several terms gets a term picker.
  if (row.entity && row.entity.terms.length > 1 && !row.disabledReason) {
    body.appendChild(renderTermPicker(row, () => refreshEntityRow(row, spans)));
  }
  // A changed sections row shows a per-section diff instead of the coarse current → extracted text.
  if (row.sectionsDiff && row.changed && !row.disabledReason) body.appendChild(renderSectionsDiff(row.sectionsDiff));
  else body.appendChild(renderValues(row, spans));
  wrap.appendChild(body);
  return wrap;
}

function sectionDiffLine(item: SectionDiffItem): HTMLDivElement {
  switch (item.kind) {
    case "changed": {
      let text = `~ ${item.oldLabel} → ${item.newLabel}`;
      if (item.oldChildren !== item.newChildren) {
        text += ` · ${plural(item.oldChildren, "item")} → ${plural(item.newChildren, "item")}`;
      }
      return el("div", "fill-sec-changed", text);
    }
    case "added":
      return el("div", "fill-sec-added", `+ ${item.newLabel}`);
    case "removed":
      return el("div", "fill-sec-removed", `− ${item.oldLabel}`);
    case "unchanged":
      return el("div", "fill-sec-unchanged", `${item.count} unchanged`);
  }
}

function renderSectionsDiff(diff: readonly SectionDiffItem[]): HTMLDivElement {
  const box = el("div", "fill-sections");
  for (const item of diff) box.appendChild(sectionDiffLine(item));
  return box;
}

/** A `<select>` of the linked terms. Pointer events don't bubble, so it never toggles the row's `<label>`. */
function renderTermPicker(row: FillRow, onPick: () => void): HTMLSelectElement {
  const entity = row.entity;
  const sel = el("select", "fill-term-select");
  if (!entity) return sel;
  const all = el("option", undefined, `All terms (${entity.terms.length})`);
  all.value = ALL_TERMS;
  sel.appendChild(all);
  for (const term of entity.terms) {
    const opt = el("option", undefined, term.name);
    opt.value = term.id;
    sel.appendChild(opt);
  }
  sel.value = entity.selectedTermId;
  sel.addEventListener("mousedown", e => e.stopPropagation());
  sel.addEventListener("click", e => e.stopPropagation());
  sel.addEventListener("change", () => {
    entity.selectedTermId = sel.value;
    onPick();
  });
  return sel;
}

function appendNames(container: HTMLElement, names: readonly string[], newNames: readonly string[], unmatchedNames: readonly string[]): void {
  const newLower = new Set(newNames.map(n => n.toLowerCase()));
  const unmatchedLower = new Set(unmatchedNames.map(n => n.toLowerCase()));
  names.forEach((name, i) => {
    if (i > 0) container.appendChild(document.createTextNode(", "));
    container.appendChild(el("span", "fill-extracted", name));
    const lower = name.toLowerCase();
    if (newLower.has(lower)) container.appendChild(el("span", "badge-new", "new"));
    // A match-only relation (website / YouTube channel) with no existing match — won't be created.
    else if (unmatchedLower.has(lower)) container.appendChild(el("span", "fill-note", " (no match)"));
  });
}
