import type { FillRead } from "../fill/fillExtract";

import { runRules } from "../fill/fillEngine";

/*
 * The pure selector generators behind the in-page "Find a selector" picker:
 *
 *   - `buildRobustSelector(el, doc)`      — a UNIQUE selector for a single element (scalar fields).
 *   - `buildCommonSelector(elements, doc)`— a MANY-MATCH selector common to 2+ example elements.
 *   - `buildExactSelector(elements, doc)` — a selector matching exactly the picked elements (List).
 *   - `buildGeneralSelector(elements, doc)` — a general container/href-anchored pattern (Generalize).
 *   - `buildRelativeSelector(root, el)`   — a selector for `el` scoped WITHIN `root` (a Section
 *                                            item's `itemName` / `itemUrl`, resolved per item).
 *
 * All verify their result by match count against the DOM, and prefer `#id` / stable data/aria/semantic
 * attributes, then stable classes; for a rotating-hash class name (e.g. `_statBlockTitle_1ckth_86`)
 * they match a stable substring via `[class*="statBlockTitle"]` rather than the volatile token.
 */

const STABLE_ATTRS = ["data-testid", "data-test", "data-qa", "data-cy", "itemprop", "aria-label", "name", "role"];

/** A generator's result. Which optional flags are set depends on the generator. */
export interface SelectorResult {
  selector: string;
  matchCount: number;
  unique?: boolean;
  matchesAll?: boolean;
  exact?: boolean;
  container?: string;
}

// --- small DOM/string helpers -------------------------------------------------------------

function tagName(el: Element): string {
  return (el.tagName || "").toLowerCase();
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
  // Minimal fallback: escape anything that isn't a safe identifier char.
  return String(value).replace(/[^\w-]/g, ch => `\\${ch}`);
}

/** How many elements `selector` matches in `root`; -1 for an invalid selector. */
function matchCount(selector: string, root: ParentNode): number {
  try {
    return root.querySelectorAll(selector).length;
  }
  catch {
    return -1;
  }
}

/** Whether `selector` matches exactly one element in `doc`, and that element is `el`. */
function uniquelyMatches(selector: string, el: Element, doc: Document): boolean {
  return matchCount(selector, doc) === 1 && doc.querySelector(selector) === el;
}

function uniqueResult(selector: string): SelectorResult {
  return {
    selector,
    unique: true,
    matchCount: 1,
  };
}

function dedupe<T>(items: T[]): T[] {
  return [...new Set(items)];
}

// --- class-token classification (the rotating-hash heuristic) ------------------------------

function segmentsOf(token: string): string[] {
  return token.split(/[_-]+/).filter(Boolean);
}

/**
 * A segment looks like a build hash (rotating), not a human name: a long pure-number, a run mixing
 * letters + digits, or a hex-ish run. `statBlockTitle` is NOT hashy; `1ckth` / `x7f2a` / `86` are.
 */
function looksHashy(segment: string): boolean {
  if (/^\d{3,}$/.test(segment)) return true;
  if (segment.length >= 4 && /\d/.test(segment) && /[a-z]/i.test(segment)) return true;
  return segment.length >= 6 && /^[0-9a-f]+$/i.test(segment) && /\d/.test(segment);
}

function isRotatingToken(token: string): boolean {
  return segmentsOf(token).some(looksHashy);
}

/** The last letter-bearing, non-hashy segment (the CSS-modules local name, e.g. `button`). */
function stableSubstring(token: string): string | null {
  const segs = segmentsOf(token).filter(s => !looksHashy(s) && /[a-z]/i.test(s));
  return segs.length ? segs[segs.length - 1] : null;
}

export type ClassToken
  = | { kind: "stable";
    token: string; }
    | { kind: "rotating";
      token: string;
      stable: string; };

export function classifyClassToken(token: string): ClassToken | null {
  if (!token) return null;
  if (!isRotatingToken(token)) return {
    kind: "stable",
    token,
  };
  const stable = stableSubstring(token);
  return stable
    ? {
      kind: "rotating",
      token,
      stable,
    }
    : null;
}

function isValidId(id: string): boolean {
  return /^[A-Za-z][\w-]*$/.test(id) && !isRotatingToken(id);
}

// --- candidate selector generation --------------------------------------------------------

/** `.token` for a stable class, `[class*="stable"]` for a rotating one. */
function classTokenFragment(info: ClassToken): string {
  return info.kind === "stable" ? `.${cssEscape(info.token)}` : `[class*="${info.stable}"]`;
}

function classFragments(el: Element): string[] {
  return Array.from(el.classList)
    .map(classifyClassToken)
    .filter((info): info is ClassToken => info !== null)
    .map(classTokenFragment);
}

/** `tag[data-x="v"]` fragments for every non-stable-list, non-rotating `data-*` attribute. */
function dataAttrCandidates(el: Element, tag: string): string[] {
  return Array.from(el.attributes)
    .filter(at => at.name.startsWith("data-")
      && !STABLE_ATTRS.includes(at.name)
      && at.value && at.value.length < 80 && !isRotatingToken(at.value))
    .map(at => `${tag}[${at.name}=${JSON.stringify(at.value)}]`);
}

/**
 * Ordered single-level selectors for `el`, most-specific first: id, stable attrs, other data-*,
 * tag+all-classes, tag+each-class, bare tag.
 */
function levelCandidates(el: Element): string[] {
  const tag = tagName(el);
  const out: string[] = [];
  if (el.id && isValidId(el.id)) out.push(`#${cssEscape(el.id)}`);
  for (const attr of STABLE_ATTRS) {
    const v = el.getAttribute(attr);
    if (v && v.length < 80) out.push(`${tag}[${attr}=${JSON.stringify(v)}]`);
  }
  out.push(...dataAttrCandidates(el, tag));
  const frags = classFragments(el);
  if (frags.length) {
    out.push(tag + frags.join(""));
    out.push(...frags.map(f => tag + f));
  }
  out.push(tag);
  return dedupe(out);
}

function firstUnique(candidates: string[], el: Element, doc: Document): string | null {
  return candidates.find(candidate => uniquelyMatches(candidate, el, doc)) ?? null;
}

/** A unique `ancestor descendant` / `ancestor > child` selector, anchored on a uniquely-selectable ancestor. */
function ancestorScopedSelector(el: Element, doc: Document): SelectorResult | null {
  let anc = el.parentElement;
  for (let depth = 0; anc && depth < 6; depth++, anc = anc.parentElement) {
    const ancSel = firstUnique(levelCandidates(anc), anc, doc);
    if (!ancSel) continue;
    for (const frag of levelCandidates(el)) {
      for (const combined of [`${ancSel} ${frag}`, `${ancSel} > ${frag}`]) {
        if (uniquelyMatches(combined, el, doc)) return uniqueResult(combined);
      }
    }
  }
  return null;
}

/** `tag:nth-of-type(n)` for `el` among its same-tag siblings. */
function nthOfType(el: Element): string {
  const tag = tagName(el);
  let idx = 1;
  for (let sib = el.previousElementSibling; sib; sib = sib.previousElementSibling) {
    if (tagName(sib) === tag) idx++;
  }
  return `${tag}:nth-of-type(${idx})`;
}

/** An `:nth-of-type` path up to the nearest uniquely-selectable ancestor. */
function nthOfTypePath(el: Element, doc: Document): SelectorResult | null {
  const parts: string[] = [];
  let cur: Element | null = el;
  for (let guard = 0; cur && cur !== doc.documentElement && guard < 8; guard++) {
    parts.unshift(nthOfType(cur));
    const parent: Element | null = cur.parentElement;
    if (!parent) break;
    const ancSel = firstUnique(levelCandidates(parent), parent, doc);
    if (ancSel) {
      parts.unshift(ancSel);
      break;
    }
    cur = parent;
  }
  const sel = parts.join(" > ");
  return uniquelyMatches(sel, el, doc) ? uniqueResult(sel) : null;
}

function defaultDocument(el: Element | undefined): Document | null {
  return el?.ownerDocument ?? (typeof document !== "undefined" ? document : null);
}

/** 1) A UNIQUE selector for a single element (best-effort non-unique fallback). */
export function buildRobustSelector(el: Element | null | undefined, doc?: Document | null): SelectorResult {
  const d = doc ?? defaultDocument(el ?? undefined);
  if (!el || !d) {
    return {
      selector: "",
      unique: false,
      matchCount: 0,
    };
  }
  let best: SelectorResult | null = null;
  for (const cand of levelCandidates(el)) {
    const n = matchCount(cand, d);
    if (n === 1 && d.querySelector(cand) === el) return uniqueResult(cand);
    if (n >= 1 && !best) {
      best = {
        selector: cand,
        unique: false,
        matchCount: n,
      };
    }
  }
  const tag = tagName(el);
  return ancestorScopedSelector(el, d)
    ?? nthOfTypePath(el, d)
    ?? best
    ?? {
      selector: tag,
      unique: false,
      matchCount: matchCount(tag, d),
    };
}

// --- common (generalize) selector ---------------------------------------------------------

/**
 * {stableKey -> selectorFragment} for one element (rotating tokens keyed by their stable part so two
 * items with differently-hashed copies of the same class intersect).
 */
function elementFragmentMap(el: Element): Map<string, string> {
  const map = new Map<string, string>();
  for (const cls of Array.from(el.classList)) {
    const info = classifyClassToken(cls);
    if (!info) continue;
    map.set(info.kind === "stable" ? `c:${info.token}` : `r:${info.stable}`, classTokenFragment(info));
  }
  return map;
}

function commonClassFragments(elements: Element[]): string[] {
  const maps = elements.map(elementFragmentMap);
  const first = maps[0] ?? new Map<string, string>();
  return [...first].filter(([key]) => maps.every(m => m.has(key))).map(([, frag]) => frag);
}

function matchesAllElements(selector: string, elements: Element[], doc: Document): boolean {
  let found: Element[];
  try {
    found = Array.from(doc.querySelectorAll(selector));
  }
  catch {
    return false;
  }
  return elements.every(el => found.includes(el));
}

function lowestCommonAncestor(elements: Element[], doc: Document): Element | null {
  for (let cand: Element | null = elements[0]; cand; cand = cand.parentElement) {
    if (elements.every(el => cand?.contains(el))) return cand === elements[0] ? cand.parentElement : cand;
  }
  return doc.body ?? null;
}

/** Whether every element shares one tag (and that tag, else "*"). */
function sharedTag(elements: Element[]): { tag: string;
  sameTag: boolean; } {
  const tag = tagName(elements[0]);
  const sameTag = elements.every(el => tagName(el) === tag);
  return {
    tag: sameTag ? tag : "*",
    sameTag,
  };
}

/** Scope a class-intersection selector inside the picks' lowest common ancestor. */
function containerScopedCommon(elements: Element[], doc: Document, frag: string): SelectorResult | null {
  const container = lowestCommonAncestor(elements, doc);
  if (!container) return null;
  const containerSel = buildRobustSelector(container, doc);
  const scoped = `${containerSel.selector} ${frag}`;
  if (!matchesAllElements(scoped, elements, doc)) return null;
  return {
    selector: scoped,
    container: containerSel.selector,
    matchCount: matchCount(scoped, doc),
    matchesAll: true,
  };
}

/** 2) A MANY-MATCH selector common to 2+ example elements. */
export function buildCommonSelector(input: (Element | null | undefined)[] | null | undefined, doc?: Document | null): SelectorResult {
  const elements = (input ?? []).filter((el): el is Element => !!el);
  const d = doc ?? defaultDocument(elements[0]);
  if (elements.length === 0 || !d) {
    return {
      selector: "",
      matchCount: 0,
      matchesAll: false,
    };
  }
  if (elements.length < 2) {
    const one = buildRobustSelector(elements[0], d);
    return {
      selector: one.selector,
      matchCount: one.matchCount,
      matchesAll: true,
    };
  }
  const {
    tag, sameTag,
  } = sharedTag(elements);
  const common = commonClassFragments(elements).join("");
  const candidates: string[] = [];
  if (sameTag && common) candidates.push(tag + common);
  if (common) candidates.push(tag + common);
  if (sameTag) candidates.push(tag);
  const hit = candidates.find(candidate => matchesAllElements(candidate, elements, d));
  if (hit) {
    return {
      selector: hit,
      matchCount: matchCount(hit, d),
      matchesAll: true,
    };
  }
  const scoped = containerScopedCommon(elements, d, tag + common);
  if (scoped) return scoped;
  const fallback = candidates[0] ?? tagName(elements[0]);
  return {
    selector: fallback,
    matchCount: matchCount(fallback, d),
    matchesAll: matchesAllElements(fallback, elements, d),
  };
}

/**
 * 2b) EXACT-SET selector for the picked elements ONLY (List mode): a CSS selector list of each element's
 * own unique selector. `exact` is false only when an element fell back to an over-matching selector.
 */
export function buildExactSelector(input: (Element | null | undefined)[] | null | undefined, doc?: Document | null): SelectorResult {
  const distinct = dedupe((input ?? []).filter((el): el is Element => !!el));
  const d = doc ?? defaultDocument(distinct[0]);
  if (distinct.length === 0 || !d) {
    return {
      selector: "",
      matchCount: 0,
      exact: false,
    };
  }
  const parts = dedupe(distinct.map(el => buildRobustSelector(el, d).selector).filter(Boolean));
  const selector = parts.join(", ");
  const count = selector ? matchCount(selector, d) : 0;
  return {
    selector,
    matchCount: count,
    exact: count === distinct.length && matchesAllElements(selector, distinct, d),
  };
}

// --- general (container/href-anchored) selector -------------------------------------------

/** The path portion of an href (query, hash, scheme and host stripped). */
function hrefPath(href: string): string {
  let path = href.split("?")[0].split("#")[0];
  const scheme = path.indexOf("://");
  if (scheme !== -1) {
    const afterScheme = path.slice(scheme + 3);
    const slash = afterScheme.indexOf("/");
    path = slash === -1 ? "" : afterScheme.slice(slash);
  }
  return path;
}

/**
 * Structural `[href*="/seg"]` fragments from an element's href PATH — the stable hook on class-hashed
 * sites. Numeric ids and hash-ish segments are dropped: `/posts/12345` → `['[href*="/posts"]']`.
 */
function hrefPathTokens(el: Element): string[] {
  const href = el.getAttribute("href");
  if (!href) return [];
  const segs = hrefPath(href).split("/")
    .filter(seg => seg.length >= 2 && seg.length <= 40 && !/^\d+$/.test(seg) && !looksHashy(seg));
  return dedupe(segs.map(seg => `[href*="/${seg}"]`));
}

/** Structural single-level descriptors of `el`'s ANCESTORS (href path tokens + classifiable classes). */
function ancestorDescriptors(el: Element): string[] {
  const out: string[] = [];
  let anc = el.parentElement;
  for (let depth = 0; anc && depth < 8; depth++, anc = anc.parentElement) {
    const atag = tagName(anc);
    out.push(...hrefPathTokens(anc).map(frag => atag + frag));
    out.push(...classFragments(anc).map(frag => atag + frag));
  }
  return dedupe(out);
}

/**
 * Is `el` an overlay/modal container? Detected at pick time (a selector can't test computed styles at
 * fill time) by ARIA (role="dialog" / aria-modal) or a computed position:fixed.
 */
function isOverlayLike(el: Element): boolean {
  if (el.getAttribute("role") === "dialog") return true;
  if (el.getAttribute("aria-modal") === "true") return true;
  try {
    const win = el.ownerDocument.defaultView;
    return !!win && typeof win.getComputedStyle === "function" && win.getComputedStyle(el).position === "fixed";
  }
  catch {
    // computed styles unavailable (e.g. a parsed document) — ARIA only.
    return false;
  }
}

/** Stable, CSS-expressible hooks identifying one overlay element (content attributes never used). */
function overlayHooks(anc: Element): string[] {
  const hooks: string[] = [];
  const role = anc.getAttribute("role");
  if (role && /^[\w-]+$/.test(role)) hooks.push(`[role="${role}"]`);
  if (anc.getAttribute("aria-modal") === "true") hooks.push("[aria-modal=\"true\"]");
  if (anc.id && isValidId(anc.id)) hooks.push(`#${cssEscape(anc.id)}`);
  const frags = classFragments(anc);
  if (frags.length) hooks.push(tagName(anc) + frags.join(""));
  for (const at of Array.from(anc.attributes)) {
    if (at.name.startsWith("data-") && at.value && at.value.length < 60 && !isRotatingToken(at.value)) {
      hooks.push(`[${at.name}=${JSON.stringify(at.value)}]`);
    }
  }
  return hooks;
}

/** Hooks for every overlay/modal ancestor of `el`, so a pattern can be tightened to "inside THIS dialog". */
function overlayScopeHooks(el: Element): string[] {
  const hooks: string[] = [];
  let anc = el.parentElement;
  for (let depth = 0; anc && depth < 12; depth++, anc = anc.parentElement) {
    if (isOverlayLike(anc)) hooks.push(...overlayHooks(anc));
  }
  return dedupe(hooks.filter(Boolean));
}

interface GeneralCandidate {
  selector: string;
  container?: string;
  href: boolean;
  scoped?: boolean;
}

/** Items of the first list present in every list. */
function commonToAll(lists: string[][]): string[] {
  return (lists[0] ?? []).filter(item => lists.every(list => list.includes(item)));
}

/** Base candidates: the picks' own classes, then each shared ancestor descriptor as a container anchor. */
function baseGeneralCandidates(distinct: Element[], inner: string, hasSelfFrags: boolean): GeneralCandidate[] {
  const candidates: GeneralCandidate[] = [];
  if (hasSelfFrags) candidates.push({
    selector: inner,
    href: false,
  });
  for (const d of commonToAll(distinct.map(ancestorDescriptors))) {
    const href = d.includes("[href*=");
    candidates.push({
      selector: `${d} ${inner}`,
      container: d,
      href,
    });
    candidates.push({
      selector: `${d} > ${inner}`,
      container: d,
      href,
    });
  }
  return candidates;
}

/** Overlay-scoped variants of every base candidate (plus a bare "<scope> <tag>"). */
function scopedGeneralCandidates(distinct: Element[], base: GeneralCandidate[], inner: string): GeneralCandidate[] {
  const scopes = commonToAll(distinct.map(overlayScopeHooks));
  if (!scopes.length) return [];
  const inners = new Map<string, boolean>(base.map(c => [c.selector, c.href]));
  inners.set(inner, false);
  return scopes.flatMap(scope => [...inners].map(([sel, href]) => ({
    selector: `${scope} ${sel}`,
    container: scope,
    href,
    scoped: true,
  })));
}

/** Fewest matches first; then overlay-scoped, href-anchored, and shorter selectors. */
function compareGeneral(a: GeneralCandidate & { count: number }, b: GeneralCandidate & { count: number }): number {
  if (a.count !== b.count) return a.count - b.count;
  if (!!a.scoped !== !!b.scoped) return a.scoped ? -1 : 1;
  if (a.href !== b.href) return a.href ? -1 : 1;
  return a.selector.length - b.selector.length;
}

/**
 * 2c) GENERAL, MANY-MATCH selector for "Generalize" mode: the most specific selector that still matches
 * EVERY picked element, anchored on a common container / link path. Never reads content attributes, so
 * on class-hashed sites it yields a structural pattern (`a[href*="/photo"] img`).
 */
export function buildGeneralSelector(input: (Element | null | undefined)[] | null | undefined, doc?: Document | null): SelectorResult {
  const distinct = dedupe((input ?? []).filter((el): el is Element => !!el));
  const d = doc ?? defaultDocument(distinct[0]);
  if (distinct.length === 0 || !d) {
    return {
      selector: "",
      matchCount: 0,
      matchesAll: false,
    };
  }
  const selfFrags = commonClassFragments(distinct);
  const inner = sharedTag(distinct).tag + selfFrags.join("");
  const base = baseGeneralCandidates(distinct, inner, selfFrags.length > 0);
  const viable = [...base, ...scopedGeneralCandidates(distinct, base, inner)]
    .map(c => ({
      ...c,
      count: matchCount(c.selector, d),
    }))
    .filter(c => c.count >= distinct.length && matchesAllElements(c.selector, distinct, d))
    .sort(compareGeneral);
  const best = viable[0];
  // Never do worse than the class-intersection generalizer.
  if (!best) return buildCommonSelector(distinct, d);
  const result: SelectorResult = {
    selector: best.selector,
    matchCount: best.count,
    matchesAll: true,
  };
  if (best.container) result.container = best.container;
  return result;
}

// --- relative (item-scoped) selector ------------------------------------------------------

function relativePath(root: Element, el: Element): string | null {
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur !== root && cur.parentElement) {
    parts.unshift(nthOfType(cur));
    cur = cur.parentElement;
  }
  return cur === root ? parts.join(" > ") : null;
}

/** Whether `selector` matches exactly `el` within `root` (false for an invalid selector). */
function uniqueWithin(root: Element, selector: string, el: Element): boolean {
  try {
    const within = root.querySelectorAll(selector);
    return within.length === 1 && within[0] === el;
  }
  catch {
    return false;
  }
}

/** 3) A selector for `el` unique WITHIN `root` (a repeated item element). */
export function buildRelativeSelector(root: Element | null | undefined, el: Element | null | undefined): SelectorResult {
  if (!root || !el) {
    return {
      selector: "",
      unique: false,
      matchCount: 0,
    };
  }
  // Absolute ids aren't meaningful inside a repeated item — skip them.
  const cands = levelCandidates(el).filter(c => !c.startsWith("#"));
  const hit = cands.find(cand => uniqueWithin(root, cand, el));
  if (hit) return uniqueResult(hit);
  const path = relativePath(root, el);
  if (path && uniqueWithin(root, path, el)) return uniqueResult(path);
  const first = cands[0] ?? tagName(el);
  const count = Math.max(0, matchCount(first, root));
  return {
    selector: first,
    unique: count === 1,
    matchCount: count,
  };
}

// --- read-mode default + engine-backed sample preview -------------------------------------

/** `src` for an image, `href` for a link, otherwise the text. */
export function defaultRead(el: Element): FillRead {
  const tag = tagName(el);
  if (tag === "img") return {
    kind: "attr",
    name: "src",
  };
  if (tag === "a") return {
    kind: "attr",
    name: "href",
  };
  return {
    kind: "text",
  };
}

/**
 * Preview a selector's extracted value through the REAL fill engine, so what the user sees equals what a
 * fill would produce. "" when nothing matches.
 */
export function sampleValueFor(selector: string, read: FillRead | null | undefined, doc?: Document | null): string {
  const d = doc ?? (typeof document !== "undefined" ? document : null);
  if (!selector || !d) return "";
  const [result] = runRules([{
    id: "__sample__",
    target: {
      kind: "field",
      field: "title",
    },
    extract: read
      ? {
        selector,
        read,
      }
      : {
        selector,
      },
  }], d);
  return result?.values[0] ?? "";
}
