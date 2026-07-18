import type { BookmarkSectionsValue, SectionEntry } from "./customProperties.js";

/**
 * Shared pure helpers over the optional `SectionEntry.tagIds` associations (both tiers of the
 * depth-2 sections model). One implementation backs the middleware's per-tag section-bookmark
 * counts, the tag page's `?taggedSections` filter, and the "Tagged sections" card field — keep
 * matching semantics here, never re-derive them per surface.
 */

/** Deduped union of `tagIds` across every entry and child (dangling ids pass through untouched). */
export function collectSectionTagIds(sections: SectionEntry[]): string[] {
  const ids = new Set<string>();
  for (const entry of sections) {
    for (const id of entry.tagIds ?? []) ids.add(id);
    for (const child of entry.children ?? []) {
      for (const id of child.tagIds ?? []) ids.add(id);
    }
  }
  return [...ids];
}

/** Whether an entry's own `tagIds` (never its children's) intersects `tagIds`. */
function entryCarriesAnyTag(entry: SectionEntry, tagIds: ReadonlySet<string>): boolean {
  return (entry.tagIds ?? []).some(id => tagIds.has(id));
}

/** Whether any section entry or child across `values` carries one of `tagIds`. */
export function sectionsCarryAnyTag(
  values: BookmarkSectionsValue[],
  tagIds: ReadonlySet<string>,
): boolean {
  return values.some(value => value.sections.some(entry => entryCarriesAnyTag(entry, tagIds)
    || (entry.children ?? []).some(child => entryCarriesAnyTag(child, tagIds))));
}

/**
 * Ordered, deduped names of every entry/child whose own `tagIds` intersects `tagIds`. A matching
 * tier-1 entry contributes its own name only — the match does NOT cascade to its children
 * (mirroring the write-time-only cascade rule on `SectionEntry.completed`).
 */
export function taggedSectionNames(
  values: BookmarkSectionsValue[],
  tagIds: ReadonlySet<string>,
): string[] {
  const names = new Set<string>();
  for (const value of values) {
    for (const entry of value.sections) {
      if (entryCarriesAnyTag(entry, tagIds)) names.add(entry.name);
      for (const child of entry.children ?? []) {
        if (entryCarriesAnyTag(child, tagIds)) names.add(child.name);
      }
    }
  }
  return [...names];
}
