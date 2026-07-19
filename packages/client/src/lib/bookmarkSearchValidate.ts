import type { BookmarkSort, BuiltinSortField } from "./bookmarkSort";

import { validateBookmarkSearch } from "@eesimple/types";

import i18n from "../i18n";

// The pure narrowing half moved to `@eesimple/types` (the middleware runs it on the
// `POST /api/bookmarks/search` body); the i18n-dependent summary stays client-side.
export { validateBookmarkSearch } from "@eesimple/types";

/** Format a "<n> <singular|plural>" fragment, or `null` when the count is zero. */
function countPart(count: number, singular: string, plural: string): string | null {
  return count > 0 ? `${count} ${count === 1 ? singular : plural}` : null;
}

/**
 * Produce the [count, presence] summary fragments for an entity that has both a list of selected
 * ids and a `presence` mode ("include" / "exclude" / etc.). Returns two elements (either may be
 * null) so the caller can spread them directly into the parts array.
 */
function entityPresenceParts(
  ids: unknown[] | undefined,
  presence: string | undefined,
  singular: string,
  plural: string,
  label: string,
): [string | null, string | null] {
  const countFragment = presence === "exclude"
    ? countPart(ids?.length ?? 0, `excluded ${singular}`, `excluded ${plural}`)
    : countPart(ids?.length ?? 0, singular, plural);
  const presenceFragment = presence !== undefined && presence !== "exclude"
    ? `${label}: ${presence}`
    : null;
  return [countFragment, presenceFragment];
}

/** Format the sections-presence summary fragment. */
function sectionPresencePart(presence: string | undefined): string | null {
  if (presence === undefined) return null;
  return presence === "exclude" ? "sections: excluded types" : `sections: ${presence}`;
}

const SORT_FIELD_LABELS: Record<BuiltinSortField, string> = {
  title: "title",
  createdAt: "date added",
  updatedAt: "date updated",
};

/** Format the active-sort summary fragment, e.g. "sorted by title (asc)" or "sorted randomly". */
function sortSummaryPart(sort: BookmarkSort | undefined): string | null {
  if (!sort) return null;
  if ("random" in sort) return "sorted randomly";
  const label = SORT_FIELD_LABELS[sort.primary.field as BuiltinSortField] ?? "a property";
  return `sorted by ${label} (${sort.primary.direction})`;
}

/**
 * Return a human-readable summary of the active filters in a raw stored filter blob
 * (e.g. "2 categories · 1 tag · 1 property"). Accepts `Record<string, unknown>` so it can be
 * called on the JSONB blob from the API without a cast at the call site.
 */
export function summarizeBookmarkSearch(raw: Record<string, unknown>): string {
  const search = validateBookmarkSearch(raw);
  const propCount
    = Object.keys(search.num ?? {}).length
      + Object.keys(search.bool ?? {}).length
      + Object.keys(search.date ?? {}).length
      + Object.keys(search.presence ?? {}).length
      + Object.keys(search.choices ?? {}).length;
  const parts: (string | null)[] = [
    ...entityPresenceParts(search.categories, search.categoryPresence, "category", "categories", "category"),
    ...entityPresenceParts(search.mediaTypes, search.mediaTypePresence, "media type", "media types", "media type"),
    ...entityPresenceParts(search.youtubeChannels, search.youtubeChannelPresence, "channel", "channels", "channel"),
    ...entityPresenceParts(search.websites, search.websitePresence, "website", "websites", "website"),
    countPart(search.relationshipTypes?.length ?? 0, "relationship type", "relationship types"),
    countPart(search.languageUsageLanguages?.length ?? 0, "usage language", "usage languages"),
    countPart(search.languageUsageLevels?.length ?? 0, "usage level", "usage levels"),
    ...entityPresenceParts(search.people, search.peoplePresence, "person", "people", "person"),
    ...entityPresenceParts(search.placeTypes, search.placeTypePresence, "place type", "place types", "place type"),
    ...entityPresenceParts(search.tags, search.tagPresence, "tag", "tags", "tags"),
    countPart(propCount, "property", "properties"),
    sectionPresencePart(search.sectionsPresence),
    search.sectionTypes && search.sectionTypes.length > 0 ? `section types: ${search.sectionTypes.join(", ")}` : null,
    search.mediaSourcePresence !== undefined ? `media source: ${search.mediaSourcePresence}` : null,
    search.fillableFieldsPresence !== undefined ? `fillable fields: ${search.fillableFieldsPresence}` : null,
    sortSummaryPart(search.sort),
  ];
  return parts.filter((part): part is string => part !== null).join(" · ") || i18n.t("No filters");
}
