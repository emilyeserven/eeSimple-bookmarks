import type { BookmarkSearch } from "./bookmarkSearch";
import type { CustomProperty } from "@eesimple/types";
import type { TFunction } from "i18next";

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
  {
    key: "fillable-fields",
    label: i18n.t("Fillable fields"),
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
      return has(search.mediaTypes) || search.mediaTypePresence !== undefined;
    case "channels":
      return has(search.youtubeChannels) || search.youtubeChannelPresence !== undefined;
    case "websites":
      return has(search.websites) || search.websitePresence !== undefined;
    case "relationship-types":
      return has(search.relationshipTypes);
    case "people":
      return has(search.people) || search.peoplePresence !== undefined;
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
    case "fillable-fields":
      return search.fillableFieldsPresence !== undefined;
  }
}

/** A compact summary of a facet's current selection, for the pill placement's active-state label. */
export interface FacetSelectionSummary {
  /** How many ids are selected for the facet (0 when only a presence mode is set). */
  count: number;
  /** The facet's presence mode, when it has one and it's set. ("fillable" is fillable-fields-only.) */
  presence?: "has" | "missing" | "exclude" | "fillable";
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
        presence: search.mediaTypePresence,
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
        presence: search.peoplePresence,
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
    case "fillable-fields":
      return {
        count: 0,
        presence: search.fillableFieldsPresence,
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

/**
 * Order `items` by their key's position in `order`. Keys absent from `order` keep their incoming
 * relative order and sort after the ordered ones (stable). Shared by the Display → Filters settings
 * list and the pill row so both honor the same `DisplayPreferenceSettings.filterOrder`; because
 * callers pass items already in default order, an empty `order` reduces to the default order.
 */
export function applyFilterOrder<T extends { key: string }>(items: readonly T[], order: string[]): T[] {
  const rank = new Map(order.map((key, index) => [key, index]));
  const fallback = order.length;
  return items
    .map((item, index) => ({
      item,
      index,
      rank: rank.get(item.key) ?? fallback,
    }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(entry => entry.item);
}

/**
 * A human description of when a standard facet appears in the filter rail — every facet is data-gated
 * (it only shows when there is data to filter on), so the Display → Filters settings row surfaces
 * this as a hover hint next to each filter.
 */
export function facetVisibilityHint(key: FilterFacetKey, t: TFunction): string {
  switch (key) {
    case "tags":
      return t("Appears when you have tags.");
    case "categories":
      return t("Appears when you have categories.");
    case "media-types":
      return t("Appears when you have media types.");
    case "channels":
      return t("Appears when you have YouTube channels.");
    case "websites":
      return t("Appears when you have websites.");
    case "relationship-types":
      return t("Appears when you have relationship types.");
    case "people":
      return t("Appears when you have people.");
    case "place-types":
      return t("Appears when you have place types.");
    case "genre-moods":
      return t("Appears when you have genres & moods.");
    case "sections":
      return t("Appears when a Sections-type custom property exists.");
    case "media-source":
      return t("Appears when a bookmark is linked to Plex, Kavita, an ISBN, or an RSS feed.");
    case "fillable-fields":
      return t("Appears when a bookmark's website has an extension-fill rule targeting a bookmark field.");
  }
}

/** The hover hint for a custom-property filter row (properties are gated by enablement + category lock). */
export function propertyVisibilityHint(t: TFunction): string {
  return t("Appears when enabled; a category-locked property also needs a matching category or media type selected.");
}
