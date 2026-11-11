import type { FillExtract, FillTarget, SectionFillEntryType } from "@eesimple/types";

import { applyFilter, candidateNodes, filterCandidates, matchesText, readValue, textExcluding } from "./fillExtract";
import { applyTransforms } from "./fillTransforms";

/*
 * Sections extraction. A `sections` target builds a structured (optionally two-tier) list of entries
 * instead of the flat string[] every other target produces. The popup assigns ids and assembles the
 * stored `BookmarkSectionsValue`.
 */

export type SectionsTarget = Extract<FillTarget, { kind: "sections" }>;

/** One extracted section entry (ids are assigned later, in the popup). */
export interface ExtractedSectionEntry {
  name: string;
  type: SectionFillEntryType;
  startValue: string;
  endValue?: string;
  url?: string;
  completed?: boolean;
  children?: ExtractedSectionEntry[];
}

/** An item's display name: a relative sub-selector's text, or the item's own trimmed text. */
function readName(el: Element, nameSelector: string | undefined, excludeSelectors?: readonly string[]): string {
  if (nameSelector) {
    const named = el.querySelector(nameSelector);
    if (named) return textExcluding(named, excludeSelectors);
  }
  return textExcluding(el, excludeSelectors);
}

/**
 * Compose an item's name from `target.nameParts`: each part resolves a value from a relative selector
 * (or the item itself), narrows it with its own filters, reads + transforms it; the non-empty parts are
 * joined by `namePartSeparator` (default ""). Falls back to `readName` without parts, or when no part
 * resolved (so an item is never left nameless and silently dropped).
 */
function readComposedName(el: Element, target: SectionsTarget, excludeSelectors?: readonly string[]): string {
  const nameParts = target.nameParts ?? [];
  if (nameParts.length === 0) return readName(el, target.itemName, excludeSelectors);
  const baseUrl = el.ownerDocument.baseURI;
  const parts: string[] = [];
  for (const part of nameParts) {
    let candidates = part.selector ? Array.from(el.querySelectorAll(part.selector)) : [el];
    candidates = (part.filters ?? []).reduce((out, filter) => applyFilter(out, filter), candidates);
    if (candidates.length === 0) continue;
    const raw = readValue(candidates[0], part.read, excludeSelectors);
    if (raw == null) continue;
    // `readValue` already trims; don't re-trim after transforms so intentional affix spacing survives.
    const value = applyTransforms(raw, part.transform, baseUrl);
    if (value !== "") parts.push(value);
  }
  if (parts.length === 0) return readName(el, target.itemName, excludeSelectors);
  return parts.join(target.namePartSeparator ?? "");
}

/** Run the value pipeline (read + transforms) for one item element → its startValue. */
function readItemValue(el: Element, extract: FillExtract): string {
  const raw = readValue(el, extract.read, extract.excludeSelectors);
  if (raw == null) return "";
  return applyTransforms(raw, extract.transform, el.ownerDocument.baseURI).trim();
}

/**
 * A per-item link's href via the relative `itemUrl` sub-selector (undefined when unset/absent). With
 * `resolveItemUrl`, a relative href is resolved against the page URL (raw fallback on failure).
 */
function readItemUrl(el: Element, target: SectionsTarget): string | undefined {
  if (!target.itemUrl) return undefined;
  const href = el.querySelector(target.itemUrl)?.getAttribute("href");
  if (!href) return undefined;
  const trimmed = href.trim();
  const baseUrl = el.ownerDocument.baseURI;
  if (!target.resolveItemUrl || !baseUrl) return trimmed;
  try {
    return new URL(trimmed, baseUrl).href;
  }
  catch {
    return trimmed;
  }
}

/** Whether an entry carries anything worth keeping — a name, a value, a link, or ≥1 child. */
function isNonEmptyEntry(entry: ExtractedSectionEntry | null): entry is ExtractedSectionEntry {
  return !!entry && !!(entry.name || entry.startValue || entry.url != null || entry.children?.length);
}

/**
 * Build one leaf entry from an item element, or null when it resolved to nothing. A `name` entry (and
 * a `url` entry with a per-item link selector) carries no positional value.
 */
function buildSectionLeaf(el: Element, target: SectionsTarget, extract: FillExtract): ExtractedSectionEntry | null {
  const noValue = target.entryType === "name" || (!!target.itemUrl && target.entryType === "url");
  const name = readComposedName(el, target, extract.excludeSelectors);
  const startValue = noValue ? "" : readItemValue(el, extract);
  const url = readItemUrl(el, target);
  if (!name && !startValue && url == null) return null;
  const leaf: ExtractedSectionEntry = {
    name,
    type: target.entryType,
    startValue,
  };
  if (url != null) leaf.url = url;
  return leaf;
}

// Matches a line-leading "m:ss" / "h:mm:ss" timestamp, a separator, and the trailing label.
const TIMESTAMP_LINE_SOURCE = "(?:^|\\n)\\s*(\\d{1,2}(?::\\d{2}){1,2})[\\s\\-–—:.)\\]]+([^\\n]+)";

function clockToSeconds(clock: string): number {
  return clock.split(":").reduce((total, part) => total * 60 + Number.parseInt(part, 10), 0);
}

/** Parse a text block (e.g. a video description) into flat timestamp entries (startValue = seconds). */
function parseTimestampSections(text: string, entryType: SectionFillEntryType): ExtractedSectionEntry[] {
  const re = new RegExp(TIMESTAMP_LINE_SOURCE, "g");
  const entries: ExtractedSectionEntry[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const label = m[2].trim();
    if (!label) continue;
    entries.push({
      name: label,
      type: entryType,
      startValue: String(clockToSeconds(m[1])),
    });
  }
  return entries;
}

/**
 * Grouped by item text: an item whose OWN name (not the composed `nameParts` name) matches
 * `sectionMatch` opens a top-level section; following items nest under it. Items before the first
 * match stay top-level.
 */
function groupByItemText(target: SectionsTarget, extract: FillExtract, doc: Document): ExtractedSectionEntry[] {
  const sectionMatch = target.sectionMatch;
  if (!sectionMatch) return [];
  const groups: ExtractedSectionEntry[] = [];
  let current: ExtractedSectionEntry | null = null;
  for (const el of filterCandidates(candidateNodes(extract, doc), extract)) {
    const leaf = buildSectionLeaf(el, target, extract);
    if (!leaf) continue;
    if (matchesText(readName(el, target.itemName, extract.excludeSelectors), sectionMatch)) {
      leaf.children = [];
      groups.push(leaf);
      current = leaf;
    }
    else if (current) {
      current.children?.push(leaf);
    }
    else {
      groups.push(leaf);
    }
  }
  return groups.filter(isNonEmptyEntry);
}

/**
 * Grouped by a section-header selector on a flat page: headers and items are interleaved siblings.
 * Walk both in document order and nest each item under the most recent header. Item-level filters
 * apply to the items only (membership by identity).
 */
function groupByHeader(target: SectionsTarget, extract: FillExtract, doc: Document): ExtractedSectionEntry[] {
  const headerSelector = target.sectionHeaderSelector ?? "";
  const groups: ExtractedSectionEntry[] = [];
  let currentGroup: ExtractedSectionEntry | null = null;
  const keptItems = new Set(filterCandidates(candidateNodes(extract, doc), extract));
  for (const el of Array.from(doc.querySelectorAll(`${headerSelector},${extract.selector ?? ""}`))) {
    if (el.matches(headerSelector)) {
      currentGroup = {
        name: textExcluding(el, extract.excludeSelectors),
        type: target.entryType,
        startValue: "",
        children: [],
      };
      groups.push(currentGroup);
      continue;
    }
    if (!keptItems.has(el)) continue; // an item the filters dropped
    const leaf = buildSectionLeaf(el, target, extract);
    if (!leaf) continue;
    if (currentGroup) currentGroup.children?.push(leaf);
    else groups.push(leaf);
  }
  return groups.filter(isNonEmptyEntry);
}

/** Tiered: a repeated container carries a header and its own items (the children). */
function groupByContainer(target: SectionsTarget, extract: FillExtract, doc: Document): ExtractedSectionEntry[] {
  return Array.from(doc.querySelectorAll(target.container ?? "")).map((group): ExtractedSectionEntry => {
    const items = filterCandidates(Array.from(group.querySelectorAll(extract.selector ?? "")), extract);
    return {
      name: target.header ? readName(group, target.header, extract.excludeSelectors) : "",
      type: target.entryType,
      startValue: "",
      children: items.map(item => buildSectionLeaf(item, target, extract)).filter(isNonEmptyEntry),
    };
  }).filter(isNonEmptyEntry);
}

/**
 * Extract a `sections` rule's structured entries. Precedence: timestamp parsing, then
 * `sectionMatch` > `sectionHeaderSelector` > `container`, else a flat list.
 */
export function runSectionsRule(target: SectionsTarget, extract: FillExtract, doc: Document): ExtractedSectionEntry[] {
  if (target.entryType === "timestamp") {
    const text = candidateNodes(extract, doc)
      .map(el => textExcluding(el, extract.excludeSelectors))
      .join("\n");
    return parseTimestampSections(text, target.entryType);
  }
  if (target.sectionMatch) return groupByItemText(target, extract, doc);
  if (target.sectionHeaderSelector) return groupByHeader(target, extract, doc);
  if (target.container) return groupByContainer(target, extract, doc);
  return filterCandidates(candidateNodes(extract, doc), extract)
    .map(el => buildSectionLeaf(el, target, extract))
    .filter(isNonEmptyEntry);
}
