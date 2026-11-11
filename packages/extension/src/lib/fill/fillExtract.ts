import type { FillExtract, FillFilter, TextMatch } from "@eesimple/types";

import { applyTransforms } from "./fillTransforms";

/*
 * The DOM half of the fill pipeline: candidate selection, filters, and value reads. Shared by the flat
 * `runRule` below and the structured sections extractor (`fillSections.ts`).
 */

/** The `read` options of a {@link FillExtract} (default: trimmed text). */
export type FillRead = NonNullable<FillExtract["read"]>;

function trimmedText(el: Element): string {
  return (el.textContent ?? "").trim();
}

/**
 * Read an element's trimmed text with `excludeSelectors`' matching descendants stripped first. Works on
 * a throwaway clone so the live page is untouched; a bad selector is skipped (never poisons the batch).
 * No selectors → identical to `trimmedText`.
 */
export function textExcluding(el: Element, excludeSelectors?: readonly string[]): string {
  if (!excludeSelectors || excludeSelectors.length === 0) return trimmedText(el);
  const clone = el.cloneNode(true) as Element;
  for (const selector of excludeSelectors) {
    let matches: NodeListOf<Element>;
    try {
      matches = clone.querySelectorAll(selector);
    }
    catch {
      continue;
    }
    matches.forEach(node => node.remove());
  }
  return (clone.textContent ?? "").trim();
}

function elementSiblings(el: Element): Element[] {
  const parent = el.parentElement;
  if (!parent) return [];
  return Array.from(parent.children).filter(child => child !== el);
}

/** Test `text` against a {@link TextMatch}. An invalid regex throws (a per-rule error). */
export function matchesText(text: string, match: TextMatch): boolean {
  if (match.mode === "regex") {
    // Build from the raw (un-lowercased) value so char classes stay intact; add `i` when
    // case-insensitive.
    return new RegExp(match.value, match.caseSensitive ? "" : "i").test(text);
  }
  const target = match.caseSensitive ? text : text.toLowerCase();
  const value = match.caseSensitive ? match.value : match.value.toLowerCase();
  if (match.mode === "equals") return target === value;
  if (match.mode === "contains") return target.includes(value);
  throw new Error(`Unknown text match mode: ${String((match as { mode?: string }).mode)}`);
}

function ancestorMatches(el: Element, match: TextMatch, maxDepth: number | undefined): boolean {
  let node = el.parentElement;
  let depth = 0;
  const limit = typeof maxDepth === "number" ? maxDepth : Infinity;
  while (node && depth < limit) {
    if (matchesText(trimmedText(node), match)) return true;
    node = node.parentElement;
    depth += 1;
  }
  return false;
}

/** Map each candidate to its nearest matching ancestor, drop misses, de-duplicate. */
function closestAncestors(candidates: Element[], selector: string): Element[] {
  const mapped: Element[] = [];
  for (const el of candidates) {
    const found = el.closest(selector);
    if (found && !mapped.includes(found)) mapped.push(found);
  }
  return mapped;
}

/** Keep candidates that don't match `selector`; a malformed selector keeps everything. */
function withoutSelector(candidates: Element[], selector: string): Element[] {
  return candidates.filter((el) => {
    try {
      return !el.matches(selector);
    }
    catch {
      return true;
    }
  });
}

/** Narrow (or, for `closest`, map) the candidate set by one filter. Applied in order. */
export function applyFilter(candidates: Element[], filter: FillFilter): Element[] {
  switch (filter.kind) {
    case "selfText":
      return candidates.filter(el => matchesText(trimmedText(el), filter.match));
    case "siblingText":
      return candidates.filter(el => elementSiblings(el).some(sib => matchesText(trimmedText(sib), filter.match)));
    case "ancestorText":
      return candidates.filter(el => ancestorMatches(el, filter.match, filter.maxDepth));
    case "closest":
      return closestAncestors(candidates, filter.selector);
    case "nth": {
      const index = filter.index < 0 ? candidates.length + filter.index : filter.index;
      return candidates[index] ? [candidates[index]] : [];
    }
    case "exclude":
      return candidates.filter(el => !matchesText(trimmedText(el), filter.match));
    case "excludeSelector":
      return withoutSelector(candidates, filter.selector);
    default:
      throw new Error(`Unknown filter kind: ${String((filter as { kind?: string }).kind)}`);
  }
}

/** Run every filter of `extract` over `nodes`, in order. */
export function filterCandidates(nodes: Element[], extract: FillExtract): Element[] {
  return (extract.filters ?? []).reduce((out, filter) => applyFilter(out, filter), nodes);
}

/**
 * Pull the first `url(…)` out of a CSS `background-image` value. Handles quoted/unquoted urls and a
 * multi-layer list (takes the first layer); null for `none` / no url.
 */
function firstBackgroundImageUrl(value: string): string | null {
  if (!value || value === "none") return null;
  const m = /url\(\s*(['"]?)([^'")]+)\1\s*\)/i.exec(value);
  return m ? m[2].trim() : null;
}

/**
 * Read a `background-image` URL from the element — the element itself first, then its `::before` /
 * `::after` pseudo-elements (hero headers often paint artwork on a pseudo-element, unreachable by a
 * CSS selector). Falls back to the inline style when no computed style is available.
 */
function backgroundImageValue(el: Element): string | null {
  const view = el.ownerDocument.defaultView;
  if (view && typeof view.getComputedStyle === "function") {
    for (const pseudo of [null, "::before", "::after"]) {
      let raw = "";
      try {
        raw = view.getComputedStyle(el, pseudo).backgroundImage || "";
      }
      catch {
        raw = "";
      }
      const url = firstBackgroundImageUrl(raw);
      if (url != null) return url;
    }
  }
  const inline = (el as HTMLElement).style?.backgroundImage ?? "";
  return firstBackgroundImageUrl(inline);
}

/**
 * Serialize a matched inline `<svg>` (the element itself, or its first descendant `<svg>`) into a
 * `data:image/svg+xml,…` URI so it can be uploaded as an image. `XMLSerializer` (not `outerHTML`)
 * keeps the `xmlns` a browser needs to render the SVG standalone.
 */
function svgDataUrl(el: Element): string | null {
  const svg = el.namespaceURI === "http://www.w3.org/2000/svg" && el.localName === "svg"
    ? el
    : el.querySelector("svg");
  if (!svg) return null;
  let markup: string;
  try {
    markup = new XMLSerializer().serializeToString(svg);
  }
  catch {
    return null;
  }
  return markup ? `data:image/svg+xml,${encodeURIComponent(markup)}` : null;
}

/**
 * Read a raw string from an element. Returns null for a missing attribute so the caller drops it.
 * `excludeSelectors` strips matching descendants before a `text` read (ignored for the other reads).
 */
export function readValue(el: Element, read: FillRead | undefined, excludeSelectors?: readonly string[]): string | null {
  if (!read || read.kind === "text") return textExcluding(el, excludeSelectors);
  switch (read.kind) {
    case "attr": {
      const attr = el.getAttribute(read.name);
      return attr == null ? null : attr.trim();
    }
    case "backgroundImage":
      return backgroundImageValue(el);
    case "svg":
      return svgDataUrl(el);
    default:
      throw new Error(`Unknown read kind: ${String((read as { kind?: string }).kind)}`);
  }
}

/**
 * Extraction candidates for an extract. The `meta` source matches a `<meta>` tag by its
 * name/property/itemprop attribute; every other source (absent = "selector") runs the CSS selector.
 */
export function candidateNodes(extract: FillExtract, doc: Document): Element[] {
  if (extract.source === "meta") {
    const key = extract.metaKey ?? "";
    return Array.from(doc.querySelectorAll("meta[name], meta[property], meta[itemprop]")).filter(el =>
      el.getAttribute("name") === key
      || el.getAttribute("property") === key
      || el.getAttribute("itemprop") === key);
  }
  return Array.from(doc.querySelectorAll(extract.selector ?? ""));
}

/** Trim, drop empties, de-duplicate while preserving order. */
function uniqueTrimmed(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }
  return result;
}

/** The flat extraction pipeline: selector → filters → read → transforms → split → unique. */
export function runExtract(extract: FillExtract, doc: Document): string[] {
  const candidates = filterCandidates(candidateNodes(extract, doc), extract);
  // Meta tags carry their value in `content` — default the read to it (an explicit `read` overrides).
  const read: FillRead = extract.read ?? (extract.source === "meta"
    ? {
      kind: "attr",
      name: "content",
    }
    : {
      kind: "text",
    });
  const baseUrl = doc.baseURI;
  let values = candidates
    .map(el => readValue(el, read, extract.excludeSelectors))
    .filter((raw): raw is string => raw != null)
    // Transforms run as a whole pipeline per value (each step sees the previous step's output).
    .map(value => applyTransforms(value, extract.transform, baseUrl));
  const split = extract.split;
  if (split) values = values.flatMap(value => value.split(split));
  return uniqueTrimmed(values);
}
