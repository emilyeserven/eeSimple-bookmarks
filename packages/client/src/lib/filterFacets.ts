import type { BookmarkSearch } from "./bookmarkSearch";

/**
 * The standard (non-property) filter facets, in display order. The `key` of each must match the
 * corresponding section `key` used in {@link FilterSections} so the Display → Filters settings tab
 * and the rail agree on which facet a stored {@link DisplayPreferenceSettings.onDemandFilters} entry
 * refers to. Custom-property filters are keyed by their property id instead and are not listed here.
 */
export const FILTER_FACETS = [
  {
    key: "tags",
    label: "Tags",
  },
  {
    key: "categories",
    label: "Category",
  },
  {
    key: "media-types",
    label: "Media type",
  },
  {
    key: "channels",
    label: "YouTube channel",
  },
  {
    key: "websites",
    label: "Website",
  },
  {
    key: "relationship-types",
    label: "Relationship type",
  },
  {
    key: "authors",
    label: "Author",
  },
  {
    key: "sections",
    label: "Sections",
  },
] as const;

export type FilterFacetKey = (typeof FILTER_FACETS)[number]["key"];

const has = (value: unknown[] | undefined): boolean => (value?.length ?? 0) > 0;

/**
 * Whether a standard facet currently has an applied selection in `search`. A facet with an active
 * value is always shown in the rail even when configured as on-demand, so deep-linked / saved
 * filters never silently disappear.
 */
export function facetHasActiveSelection(key: FilterFacetKey, search: BookmarkSearch): boolean {
  switch (key) {
    case "tags":
      return has(search.tags) || search.tagPresence !== undefined;
    case "categories":
      return has(search.categories);
    case "media-types":
      return has(search.mediaTypes);
    case "channels":
      return has(search.youtubeChannels) || search.youtubeChannelPresence !== undefined;
    case "websites":
      return has(search.websites) || search.websitePresence !== undefined;
    case "relationship-types":
      return has(search.relationshipTypes);
    case "authors":
      return has(search.authors);
    case "sections":
      return search.sectionsPresence !== undefined || has(search.sectionTypes);
  }
}

/** Whether a custom property (by id) currently has any applied filter value in `search`. */
export function propertyHasActiveSelection(propertyId: string, search: BookmarkSearch): boolean {
  return (
    search.num?.[propertyId] !== undefined
    || search.bool?.[propertyId] !== undefined
    || search.date?.[propertyId] !== undefined
    || search.presence?.[propertyId] !== undefined
    || (search.choices?.[propertyId]?.length ?? 0) > 0
  );
}
