import type { MediaType, SectionEntryType } from "@eesimple/types";

/**
 * Map a media-type slug to the section entry type its content naturally uses. Mirrors the retired
 * per-property defaults of the pre-merge built-ins (Chapters → timestamp, Page Sections → page,
 * URL Sections → url).
 */
const SLUG_HINTS: Record<string, SectionEntryType> = {
  "video": "timestamp",
  "audio": "timestamp",
  "book": "page",
  "website-app": "url",
};

/**
 * Pick a sensible default section entry type from a bookmark's media type: the media type's own
 * slug wins, else its ancestors' (a "Movie" under "Video" hints timestamp). Returns `undefined`
 * when nothing matches — the caller falls back to the property's configured order. Used by the
 * generic "Sections" property, whose `sectionsDefaultType` is null by design.
 */
export function sectionEntryTypeHint(
  mediaTypeId: string | null | undefined,
  mediaTypes: Pick<MediaType, "id" | "slug" | "parentId">[],
): SectionEntryType | undefined {
  if (!mediaTypeId) return undefined;
  const byId = new Map(mediaTypes.map(mt => [mt.id, mt]));
  const seen = new Set<string>();
  let current = byId.get(mediaTypeId);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    const hint = SLUG_HINTS[current.slug];
    if (hint) return hint;
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return undefined;
}
