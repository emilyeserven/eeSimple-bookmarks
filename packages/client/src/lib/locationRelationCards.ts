import type { Bookmark, BookmarkLocation } from "@eesimple/types";

/**
 * A single "location relation card": one anchor bookmark and the location(s) it relates to under a
 * given location relation. Unlike relationship cards (bookmark↔bookmark), a location relation
 * qualifies each `(bookmark, location)` edge, so the members are locations, not bookmarks.
 */
export interface LocationRelationCardGroup {
  bookmark: Bookmark;
  locations: BookmarkLocation[];
}

/**
 * Build the "location relation cards" for a location relation from the locations embedded on every
 * bookmark (already loaded in the bookmarks cache) — no endpoint. For each bookmark, its location
 * edges whose `locationRelation.id` matches `relationId` become the card's members; bookmarks with no
 * matching edge are dropped. Cards are sorted by bookmark title, locations by name.
 *
 * O(n) over the already-loaded bookmark list — a sanctioned client-side derivation (mirrors
 * {@link import("./relationshipTypeCards").buildRelationshipTypeCards}).
 */
export function buildLocationRelationCards(
  relationId: string,
  allBookmarks: Bookmark[],
): LocationRelationCardGroup[] {
  const groups: LocationRelationCardGroup[] = [];
  for (const bookmark of allBookmarks) {
    const locations = bookmark.locations.filter(
      location => location.locationRelation?.id === relationId,
    );
    if (locations.length === 0) continue;
    locations.sort((a, b) => a.name.localeCompare(b.name));
    groups.push({
      bookmark,
      locations,
    });
  }
  return groups.sort((a, b) => a.bookmark.title.localeCompare(b.bookmark.title));
}
