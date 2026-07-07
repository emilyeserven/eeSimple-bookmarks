import type { BookmarkSearch } from "./bookmarkSearch";
import type { CustomProperty } from "@eesimple/types";

import i18n from "../i18n";

/**
 * The standard (non-property) filter facets, in display order. The `key` of each must match the
 * corresponding section `key` used in {@link FilterSections} so the Display → Filters settings tab
 * and the rail agree on which facet a stored {@link DisplayPreferenceSettings.onDemandFilters} entry
 * refers to. Custom-property filters are keyed by their property id instead and are not listed here.
 */
export const FILTER_FACETS = [
  {
    key: "tags",
    label: i18n.t("Tags"),
  },
  {
    key: "categories",
    label: i18n.t("Category"),
  },
  {
    key: "media-types",
    label: i18n.t("Media type"),
  },
  {
    key: "channels",
    label: i18n.t("YouTube channel"),
  },
  {
    key: "websites",
    label: i18n.t("Website"),
  },
  {
    key: "relationship-types",
    label: i18n.t("Relationship type"),
  },
  {
    key: "people",
    label: i18n.t("Person"),
  },
  {
    key: "place-types",
    label: i18n.t("Place type"),
  },
  {
    key: "genre-moods",
    label: i18n.t("Genres & Moods"),
  },
  {
    key: "sections",
    label: i18n.t("Sections"),
  },
  {
    key: "media-source",
    label: i18n.t("Media source"),
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
      return has(search.categories) || search.categoryPresence !== undefined;
    case "media-types":
      return has(search.mediaTypes);
    case "channels":
      return has(search.youtubeChannels) || search.youtubeChannelPresence !== undefined;
    case "websites":
      return has(search.websites) || search.websitePresence !== undefined;
    case "relationship-types":
      return has(search.relationshipTypes);
    case "people":
      return has(search.people);
    case "place-types":
      return has(search.placeTypes) || search.placeTypePresence !== undefined;
    case "genre-moods":
      return has(search.genreMoods) || search.genreMoodPresence !== undefined;
    case "sections":
      return search.sectionsPresence !== undefined || has(search.sectionTypes);
    case "media-source":
      return search.mediaSourcePresence !== undefined
        || search.plexRatingKey !== undefined
        || search.kavitaSeriesId !== undefined
        || search.isbn !== undefined
        || search.feedUrl !== undefined;
  }
}

/** A compact summary of a facet's current selection, for the pill placement's active-state label. */
export interface FacetSelectionSummary {
  /** How many ids are selected for the facet (0 when only a presence mode is set). */
  count: number;
  /** The facet's presence mode, when it has one and it's set. */
  presence?: "has" | "missing" | "exclude";
}

const count = (value: unknown[] | undefined): number => value?.length ?? 0;

/**
 * The selected-id count plus presence mode for a facet, keyed off the same slice mapping the
 * {@link facetHasActiveSelection} switch encodes. Used by the pill row to render a compact summary
 * next to the facet name; a pill is "active" (per `facetHasActiveSelection`) when either is set.
 */
export function facetSelectionSummary(key: FilterFacetKey, search: BookmarkSearch): FacetSelectionSummary {
  switch (key) {
    case "tags":
      return {
        count: count(search.tags),
        presence: search.tagPresence,
      };
    case "categories":
      return {
        count: count(search.categories),
        presence: search.categoryPresence,
      };
    case "media-types":
      return {
        count: count(search.mediaTypes),
      };
    case "channels":
      return {
        count: count(search.youtubeChannels),
        presence: search.youtubeChannelPresence,
      };
    case "websites":
      return {
        count: count(search.websites),
        presence: search.websitePresence,
      };
    case "relationship-types":
      return {
        count: count(search.relationshipTypes),
      };
    case "people":
      return {
        count: count(search.people),
      };
    case "place-types":
      return {
        count: count(search.placeTypes),
        presence: search.placeTypePresence,
      };
    case "genre-moods":
      return {
        count: count(search.genreMoods),
        presence: search.genreMoodPresence,
      };
    case "sections":
      return {
        count: count(search.sectionTypes),
        presence: search.sectionsPresence,
      };
    case "media-source":
      return {
        count: 0,
        presence: search.mediaSourcePresence,
      };
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

/**
 * A compact summary of a custom property's current selection, for the pill placement's active-state
 * label. Mirrors {@link facetSelectionSummary}'s shape so `FilterPill` can render it unmodified: only
 * `choices`-type properties have a meaningful id count; number/date/boolean properties with an active
 * value just show the pill's active state with no summary text.
 */
export function propertySelectionSummary(
  property: CustomProperty,
  search: BookmarkSearch,
): FacetSelectionSummary {
  return {
    count: property.type === "choices" ? count(search.choices?.[property.id]) : 0,
    presence: search.presence?.[property.id],
  };
}

/**
 * Whether the language-usage filter (two multi-selects, not a {@link FilterFacetKey}) currently has
 * any applied selection in `search`.
 */
export function languageUsageHasActiveSelection(search: BookmarkSearch): boolean {
  return (
    (search.languageUsageLanguages?.length ?? 0) > 0
    || (search.languageUsageLevels?.length ?? 0) > 0
  );
}
