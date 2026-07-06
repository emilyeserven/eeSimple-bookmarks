import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { FilterFacetKey } from "../lib/filterFacets";
import type { FilterFacetInputs } from "../lib/filterSidebarVisibility";
import type { TFunction } from "i18next";
import type { ReactNode } from "react";

import { useTranslation } from "react-i18next";

import { FacetPresenceToggle } from "./FilterFacetControls";
import { FilterPill } from "./FilterPill";
import {
  CategoryFilterBody,
  GenreMoodFilterBody,
  MediaTypeFilterBody,
  PersonFilterBody,
  PlaceTypeFilterBody,
  RelationshipTypeFilterBody,
  SectionsFilterBody,
  TagsFilterBody,
  WebsiteFilterBody,
  YouTubeChannelFilterBody,
} from "./FilterSidebarSectionBodies";
import { useOnDemandFilters } from "../hooks/useAppSettings";
import {
  withGenreMoodPresence,
  withPlaceTypePresence,
  withSectionsPresence,
  withTagPresence,
  withWebsitePresence,
  withYouTubeChannelPresence,
} from "../lib/bookmarkSearch";
import { FILTER_FACETS, facetHasActiveSelection, facetSelectionSummary } from "../lib/filterFacets";
import { computeFilterSidebarVisibility } from "../lib/filterSidebarVisibility";

export interface FilterPillsRowProps extends FilterFacetInputs {
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/** The facet data + search wiring threaded into each pill's popover body. */
interface FacetBodyContext {
  data: FilterPillsRowProps;
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
  t: TFunction;
}

const EMPTY_ADDED = new Set<string>();

/**
 * The popover body for a facet's pill: the same presence toggle + control + chips + Reset the sidebar
 * section renders, minus the collapsible chrome. Module-level (not a hook-calling component) so
 * `FilterPillsRow` stays well under fallow's cognitive cap — it just maps facets and delegates here.
 */
function renderFacetBody(key: FilterFacetKey, ctx: FacetBodyContext): ReactNode {
  const {
    data, search, onSearchChange, t,
  } = ctx;
  switch (key) {
    case "tags":
      return (
        <div className="space-y-3">
          <FacetPresenceToggle
            value={search.tagPresence}
            onChange={mode => onSearchChange(withTagPresence(search, mode))}
            hasLabel={t("Has tags")}
            missingLabel={t("No tags")}
          />
          <TagsFilterBody
            tree={data.tree}
            search={search}
            onSearchChange={onSearchChange}
          />
        </div>
      );
    case "categories":
      return (
        <CategoryFilterBody
          categories={data.categories}
          search={search}
          onSearchChange={onSearchChange}
        />
      );
    case "media-types":
      return (
        <MediaTypeFilterBody
          mediaTypes={data.mediaTypes}
          search={search}
          onSearchChange={onSearchChange}
        />
      );
    case "channels":
      return (
        <div className="space-y-3">
          <FacetPresenceToggle
            value={search.youtubeChannelPresence}
            onChange={mode => onSearchChange(withYouTubeChannelPresence(search, mode))}
            hasLabel={t("Has value")}
            missingLabel={t("No value")}
          />
          <YouTubeChannelFilterBody
            youtubeChannels={data.youtubeChannels}
            search={search}
            onSearchChange={onSearchChange}
          />
        </div>
      );
    case "websites":
      return (
        <div className="space-y-3">
          <FacetPresenceToggle
            value={search.websitePresence}
            onChange={mode => onSearchChange(withWebsitePresence(search, mode))}
            hasLabel={t("Has value")}
            missingLabel={t("No value")}
          />
          <WebsiteFilterBody
            websites={data.websites}
            search={search}
            onSearchChange={onSearchChange}
          />
        </div>
      );
    case "relationship-types":
      return (
        <RelationshipTypeFilterBody
          relationshipTypes={data.relationshipTypes}
          search={search}
          onSearchChange={onSearchChange}
        />
      );
    case "people":
      return (
        <PersonFilterBody
          people={data.people}
          search={search}
          onSearchChange={onSearchChange}
        />
      );
    case "place-types":
      return (
        <div className="space-y-3">
          <FacetPresenceToggle
            value={search.placeTypePresence}
            onChange={mode => onSearchChange(withPlaceTypePresence(search, mode))}
            hasLabel={t("Has place type")}
            missingLabel={t("No place type")}
          />
          <PlaceTypeFilterBody
            placeTypes={data.placeTypes}
            search={search}
            onSearchChange={onSearchChange}
          />
        </div>
      );
    case "genre-moods":
      return (
        <div className="space-y-3">
          <FacetPresenceToggle
            value={search.genreMoodPresence}
            onChange={mode => onSearchChange(withGenreMoodPresence(search, mode))}
            hasLabel={t("Has any")}
            missingLabel={t("Has none")}
          />
          <GenreMoodFilterBody
            genreMoods={data.genreMoods}
            search={search}
            onSearchChange={onSearchChange}
          />
        </div>
      );
    case "sections":
      return (
        <div className="space-y-2">
          <FacetPresenceToggle
            value={search.sectionsPresence}
            onChange={mode => onSearchChange(withSectionsPresence(search, mode))}
            hasLabel={t("Has sections")}
            missingLabel={t("No sections")}
          />
          <SectionsFilterBody
            search={search}
            onSearchChange={onSearchChange}
          />
        </div>
      );
  }
}

/**
 * The "pills" filter placement: a row of pills under the search bar, one per visible registry facet.
 * Visibility reuses the sidebar's on-demand gating (`computeFilterSidebarVisibility`) — an on-demand
 * facet gets no pill until it has an active selection (the "Add filter" pill is a later wave). Custom
 * properties and language usage are intentionally out of scope here.
 */
export function FilterPillsRow(props: FilterPillsRowProps) {
  const {
    search, onSearchChange,
  } = props;
  const {
    t,
  } = useTranslation();
  const onDemand = useOnDemandFilters();
  const {
    facetVisible,
  } = computeFilterSidebarVisibility(props, search, onDemand, EMPTY_ADDED);

  const visibleFacets = FILTER_FACETS.filter(facet => facetVisible[facet.key]);
  if (visibleFacets.length === 0) return null;

  const ctx: FacetBodyContext = {
    data: props,
    search,
    onSearchChange,
    t,
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visibleFacets.map(facet => (
        <FilterPill
          key={facet.key}
          label={facet.label}
          active={facetHasActiveSelection(facet.key, search)}
          summary={facetSelectionSummary(facet.key, search)}
        >
          {renderFacetBody(facet.key, ctx)}
        </FilterPill>
      ))}
    </div>
  );
}
