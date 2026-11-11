import type { ExtractedSectionEntry } from "../../lib/fill/fillSections";
import type { SectionEntry } from "@eesimple/types";

import { plural, randomId } from "./format";

/*
 * Pure helpers for the `sections` review row: id assignment, completion carry-over, content equality
 * and the per-section display diff.
 */

/** The content fields two section lists are compared on (ids and completion are ignored). */
type SectionContent = Pick<SectionEntry, "name" | "type" | "startValue" | "endValue" | "url"> & {
  children?: SectionContent[];
  completed?: boolean;
};

/**
 * Deep content comparison of two section-entry lists, IGNORING `id` (regenerated on every scrape) so a
 * re-scrape of unchanged sections doesn't read as "changed". Absent vs empty children are equal.
 */
export function sectionsContentEqual(a: readonly SectionContent[] | undefined, b: readonly SectionContent[] | undefined): boolean {
  const ea = a ?? [];
  const eb = b ?? [];
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

/** One persisted entry from an extracted one: a fresh id plus the non-blank content fields. */
function sectionEntryWithId(entry: ExtractedSectionEntry): SectionEntry {
  const out: SectionEntry = {
    id: randomId(),
    name: entry.name ?? "",
    type: entry.type,
    startValue: entry.startValue ?? "",
  };
  if (entry.endValue) out.endValue = entry.endValue;
  if (entry.url) out.url = entry.url;
  if (entry.completed === true) out.completed = true;
  return out;
}

/** Assign a fresh id to each entry and child (depth 2). */
export function assignSectionIds(entries: readonly ExtractedSectionEntry[]): SectionEntry[] {
  return entries.map((entry) => {
    const out = sectionEntryWithId(entry);
    if (Array.isArray(entry.children)) out.children = entry.children.map(sectionEntryWithId);
    return out;
  });
}

const normName = (s: { name?: string }) => (s.name || "").trim().toLowerCase();

/** A per-normalized-name queue, so each name pairs at most once. */
function namePool<T extends { name?: string }>(items: readonly T[]): Map<string, T[]> {
  const pool = new Map<string, T[]>();
  for (const item of items) {
    const key = normName(item);
    const queue = pool.get(key) ?? [];
    queue.push(item);
    pool.set(key, queue);
  }
  return pool;
}

/**
 * Carry the stored list's `completed` flags onto a freshly-extracted list so a re-fill doesn't wipe
 * read progress. Entries pair by normalized name; a matched section's children pair the same way.
 * Mutates and returns `entries`. (`completed` never affects `sectionsContentEqual`.)
 */
export function carrySectionCompletion(entries: SectionEntry[], storedSections: readonly SectionEntry[] | undefined): SectionEntry[] {
  const stored = storedSections ?? [];
  if (stored.length === 0) return entries;
  const pool = namePool(stored);
  for (const entry of entries) {
    const match = pool.get(normName(entry))?.shift();
    if (!match) continue;
    if (match.completed === true) entry.completed = true;
    if (entry.children && match.children) carrySectionCompletion(entry.children, match.children);
  }
  return entries;
}

/** "N sections, M items" (M = total children; omitted when there are none). */
export function summarizeSections(sections: readonly SectionContent[]): string {
  const items = sections.reduce((sum, s) => sum + (s.children?.length ?? 0), 0);
  const base = plural(sections.length, "section");
  return items > 0 ? `${base}, ${plural(items, "item")}` : base;
}

/** Integer seconds as a clock (`m:ss`, or `h:mm:ss` past an hour); non-numeric values unchanged. */
function formatSectionSeconds(value: string): string {
  const total = Number(value);
  if (!Number.isFinite(total)) return value;
  const secs = Math.max(0, Math.floor(total));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** A section's positional range — "start–end" or "start" (timestamps as clocks; "" for `url`). */
function formatSectionRange(entry: SectionContent): string {
  if (entry.type === "url") return "";
  const display = (v: string) => (entry.type === "timestamp" ? formatSectionSeconds(v) : v);
  const start = display(entry.startValue || "");
  return entry.endValue ? `${start}–${display(entry.endValue)}` : start;
}

/** "Chapter 1 (1–20)" / "Intro (0:00–5:30)" / just "Preface". */
function sectionLineLabel(entry: SectionContent): string {
  const name = (entry.name || "").trim() || "(unnamed)";
  const range = formatSectionRange(entry);
  return range ? `${name} (${range})` : name;
}

export type SectionDiffItem
  = | { kind: "changed";
    name: string;
    oldLabel: string;
    newLabel: string;
    oldChildren: number;
    newChildren: number; }
    | { kind: "added";
      name: string;
      newLabel: string; }
      | { kind: "removed";
        name: string;
        oldLabel: string; }
        | { kind: "unchanged";
          count: number; };

/**
 * Content-level diff of two top-level section lists for display, pairing by normalized name. Emitted
 * order: changed, added, removed, then one "unchanged" count. Children are summarized as counts.
 */
export function diffSections(current: readonly SectionContent[] | undefined, extracted: readonly SectionContent[] | undefined): SectionDiffItem[] {
  const pool = namePool(current ?? []);
  const changed: SectionDiffItem[] = [];
  const added: SectionDiffItem[] = [];
  let unchanged = 0;
  for (const e of extracted ?? []) {
    const match = pool.get(normName(e))?.shift();
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
        oldChildren: match.children?.length ?? 0,
        newChildren: e.children?.length ?? 0,
      });
    }
  }
  // Anything left in the pool was in current but not extracted → removed.
  const removed: SectionDiffItem[] = [...pool.values()].flat().map(s => ({
    kind: "removed",
    name: s.name || "",
    oldLabel: sectionLineLabel(s),
  }));
  const items = [...changed, ...added, ...removed];
  if (unchanged > 0) items.push({
    kind: "unchanged",
    count: unchanged,
  });
  return items;
}
