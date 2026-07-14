import type { BookmarkSearch } from "./bookmarkSearch";
import type { FilterFacetKey } from "./filterFacets";
import type { Bookmark, Person, Category, CustomProperty, GenreMood, MediaType, PlaceType, RelationshipType, TagNode, Website, YouTubeChannel } from "@eesimple/types";

import { FILTER_FACETS, facetHasActiveSelection, propertyHasActiveSelection } from "./filterFacets";

/** The bookmark fields the presence-only facets' (media-source, fillable-fields) data checks read. */
export type MediaSourceBookmark = Pick<Bookmark, "plexRatingKey" | "kavitaSeriesId" | "isbn" | "feedUrl" | "hasFillableFields">;

/** The facet source data the filter rail derives its visibility from. */
export interface FilterFacetInputs {
  tree: TagNode[];
  properties: CustomProperty[];
  categories?: Category[];
  mediaTypes?: MediaType[];
  youtubeChannels?: YouTubeChannel[];
  websites?: Website[];
  relationshipTypes?: RelationshipType[];
  people?: Person[];
  placeTypes?: PlaceType[];
  genreMoods?: GenreMood[];
  /** Bookmarks in view, used to check whether any carries a Plex/Kavita/ISBN/feed identity. */
  bookmarks?: MediaSourceBookmark[];
}

/** The derived visibility state the filter rail renders from. */
export interface FilterVisibility {
  /** Whether any facet has data at all — drives the rail's "No filters available" fallback. */
  hasFilters: boolean;
  /** Per-facet: present in data AND currently revealed (not on-demand, added, or actively filtering). */
  facetVisible: Record<FilterFacetKey, boolean>;
  /** Enabled properties that are currently revealed. */
  visibleProperties: CustomProperty[];
  /** The on-demand filters that have data but aren't shown yet — offered in the Add-filter menu. */
  addableFilters: { key: string;
    label: string; }[];
}

const has = (value: unknown[] | undefined): boolean => (value?.length ?? 0) > 0;

/** Data presence (ungated): whether each facet has any data to filter on at all. */
export function computeFacetData(inputs: FilterFacetInputs): Record<FilterFacetKey, boolean> {
  const enabledProperties = inputs.properties.filter(p => p.enabled);
  return {
    "tags": inputs.tree.length > 0,
    "categories": has(inputs.categories),
    "media-types": has(inputs.mediaTypes),
    "channels": has(inputs.youtubeChannels),
    "websites": has(inputs.websites),
    "relationship-types": has(inputs.relationshipTypes),
    "people": has(inputs.people),
    "place-types": has(inputs.placeTypes),
    "genre-moods": has(inputs.genreMoods),
    "sections": enabledProperties.some(p => p.type === "sections"),
    "media-source": (inputs.bookmarks ?? []).some(b =>
      b.plexRatingKey != null || b.kavitaSeriesId != null || b.isbn != null || b.feedUrl != null),
    "fillable-fields": (inputs.bookmarks ?? []).some(b => b.hasFillableFields),
  };
}

/**
 * Derive the whole rail's visibility state: filters configured as "on demand"
 * (Settings → Display → Filters) are hidden until the user adds them from the "Add filter" control
 * (`added` tracks the ones revealed this session) — but a facet with an active value is always shown
 * so deep-linked / saved filters never silently disappear.
 */
export function computeFilterVisibility(
  inputs: FilterFacetInputs,
  search: BookmarkSearch,
  onDemand: string[],
  added: Set<string>,
): FilterVisibility {
  const enabledProperties = inputs.properties.filter(p => p.enabled);
  const facetData = computeFacetData(inputs);

  // A filter shows when it isn't on-demand, has been added this session, or already has a value.
  const revealed = (key: string, active: boolean) =>
    !onDemand.includes(key) || added.has(key) || active;

  const hasFilters = Object.values(facetData).some(Boolean) || enabledProperties.length > 0;

  const facetVisible = Object.fromEntries(FILTER_FACETS.map(facet => [
    facet.key,
    facetData[facet.key] && revealed(facet.key, facetHasActiveSelection(facet.key, search)),
  ])) as Record<FilterFacetKey, boolean>;

  const visibleProperties = enabledProperties.filter(p =>
    revealed(p.id, propertyHasActiveSelection(p.id, search)));

  const addableFilters = [
    ...FILTER_FACETS
      .filter(facet =>
        facetData[facet.key]
        && onDemand.includes(facet.key)
        && !added.has(facet.key)
        && !facetHasActiveSelection(facet.key, search))
      .map(facet => ({
        key: facet.key as string,
        label: facet.label as string,
      })),
    ...enabledProperties
      .filter(property =>
        onDemand.includes(property.id)
        && !added.has(property.id)
        && !propertyHasActiveSelection(property.id, search))
      .map(property => ({
        key: property.id,
        label: property.name,
      })),
  ];

  return {
    hasFilters,
    facetVisible,
    visibleProperties,
    addableFilters,
  };
}
