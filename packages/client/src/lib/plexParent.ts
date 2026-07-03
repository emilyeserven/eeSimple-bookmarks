import type { PlexItemResult } from "@eesimple/types";

/** The six Plex-backed taxonomy families a search can be narrowed to. */
export type PlexKind = "movie" | "show" | "episode" | "album" | "artist" | "track";

/** The minimal shape a parent taxonomy row needs for auto-matching (name + optional Plex key). */
interface ParentCandidate {
  id: string;
  name: string;
  plexRatingKey: string | null;
}

/** Which `PlexItemResult` fields carry the parent's Plex ratingKey + title for a given child kind. */
interface ParentFields {
  ratingKeyField: "parentRatingKey" | "grandparentRatingKey";
  titleField: "parentTitle" | "grandparentTitle";
}

/**
 * Resolve the id of the one existing parent taxonomy row a Plex item belongs to, or `null`.
 * Matches by the parent's Plex ratingKey first (precise), else by an exact case-insensitive name
 * match — but only when there is exactly one match (0 or >1 → `null`, mirroring the Locations
 * `singleMatchId` "link only if unambiguous" rule). Used to auto-link an Episode's TV Show
 * (`grandparent*`) or a Track's Album (`parent*`) on Plex autofill, without ever minting a parent.
 */
export function matchPlexParentId(
  item: PlexItemResult,
  parents: readonly ParentCandidate[],
  fields: ParentFields,
): string | null {
  const parentKey = item[fields.ratingKeyField];
  if (parentKey) {
    const byKey = parents.filter(parent => parent.plexRatingKey === parentKey);
    if (byKey.length === 1) return byKey[0].id;
  }
  const parentName = item[fields.titleField]?.trim().toLowerCase();
  if (parentName) {
    const byName = parents.filter(parent => parent.name.trim().toLowerCase() === parentName);
    if (byName.length === 1) return byName[0].id;
  }
  return null;
}
