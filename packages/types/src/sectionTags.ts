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

/**
 * A starred section/sub-item, paired with the name of its parent tier-1 section when it is a child
 * (`null` for a tier-1 entry). Backs both the view-only "Favorite Sections" block and the
 * favorite-sections card field so the two surfaces share one derivation.
 */
export interface FavoriteSectionRef {
  entry: SectionEntry;
  parentName: string | null;
}

/**
 * Ordered list of every starred (`isFavorite`) entry and child across `values`, in document order.
 * Favorites are independent — a starred tier-1 entry does NOT imply its children are starred, and
 * vice-versa (see {@link SectionEntry.isFavorite}).
 */
export function favoriteSectionEntries(values: BookmarkSectionsValue[]): FavoriteSectionRef[] {
  const refs: FavoriteSectionRef[] = [];
  for (const value of values) {
    for (const entry of value.sections) {
      if (entry.isFavorite === true) refs.push({
        entry,
        parentName: null,
      });
      for (const child of entry.children ?? []) {
        if (child.isFavorite === true) refs.push({
          entry: child,
          parentName: entry.name,
        });
      }
    }
  }
  return refs;
}

/** How many section entries/children across `values` are starred. */
export function favoriteSectionCount(values: BookmarkSectionsValue[]): number {
  return favoriteSectionEntries(values).length;
}
