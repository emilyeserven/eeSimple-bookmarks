import type { Bookmark } from "@eesimple/types";

/**
 * Maps a hydrated Bookmark to a plain-object representation of the ConditionInput the rule
 * evaluator sees (Sets → arrays, Maps → objects) so it round-trips cleanly through JSON.stringify.
 *
 * tagIds are the bookmark's DIRECT tags only — cascade expansion (parent matching children) is
 * applied by evaluateConditions at eval time via tagDescendants, not stored here.
 */
export function bookmarkToConditionInputJson(bookmark: Bookmark) {
  return {
    url: bookmark.url,
    title: bookmark.title,
    categoryId: bookmark.categoryId,
    tagIds: bookmark.tags.map(t => t.id),
    youtubeChannelId: bookmark.youtubeChannel?.id ?? null,
    mediaTypeId: bookmark.mediaType?.id ?? null,
    relationshipTypeIds: [...new Set(bookmark.relationships.map(r => r.relationshipTypeId))],
    numberValues: Object.fromEntries(bookmark.numberValues.map(v => [v.propertyId, v.value])),
    booleanValues: Object.fromEntries(bookmark.booleanValues.map(v => [v.propertyId, v.value])),
    dateTimeValues: Object.fromEntries(bookmark.dateTimeValues.map(v => [v.propertyId, v.value])),
    fileValues: bookmark.fileValues.map(f => f.propertyId),
  };
}
