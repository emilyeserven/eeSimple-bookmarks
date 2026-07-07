import type { FacetBodyContext } from "./useFilterPillsRow";
import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { FilterFacetKey } from "../lib/filterFacets";
import type { FilterFacetInputs } from "../lib/filterVisibility";
import type { Bookmark } from "@eesimple/types";
import type { ReactNode } from "react";

import { Plus } from "lucide-react";

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
import { LanguageUsageFilterPill } from "./LanguageUsageFilterPill";
import { PropertyFilterPill } from "./PropertyFilterPill";
import { SavedFiltersSection } from "./SavedFiltersSection";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useFilterPillsRow } from "./useFilterPillsRow";
import {
  withCategoryPresence,
  withGenreMoodPresence,
  withMediaSourcePresence,
  withMediaTypePresence,
  withPeoplePresence,
  withPlaceTypePresence,
  withSectionsPresence,
  withTagPresence,
  withWebsitePresence,
  withYouTubeChannelPresence,
} from "../lib/bookmarkSearch";
import { facetHasActiveSelection, facetSelectionSummary } from "../lib/filterFacets";

export interface FilterPillsRowProps extends FilterFacetInputs {
  /**
   * Bookmarks in view, used to derive custom-property slider bounds when a property has no min/max,
   * and to check whether any carries a Plex/Kavita/ISBN/feed identity (the "Media source" facet).
   */
  bookmarks: Pick<Bookmark, "numberValues" | "plexRatingKey" | "kavitaSeriesId" | "isbn" | "feedUrl">[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/** A facet's split popover content: the header-row toggle (if any) and the body control below it. */
interface FacetRenderResult {
  presenceControl?: ReactNode;
  body: ReactNode;
}

/**
 * The popover content for a facet's pill: the same control + chips + Reset the sidebar section
 * renders, minus the collapsible chrome. `presenceControl` (when the facet has one) renders in the
 * popover's title row rather than stacked above `body`. Module-level (not a hook-calling component)
 * so `FilterPillsRow` stays well under fallow's cognitive cap — it just maps facets and delegates
 * here.
 */
function renderFacetBody(key: FilterFacetKey, ctx: FacetBodyContext): FacetRenderResult {
  const {
    data, search, onSearchChange, t,
  } = ctx;
  switch (key) {
    case "tags":
      return {
        presenceControl: (
          <FacetPresenceToggle
            value={search.tagPresence}
            onChange={mode => onSearchChange(withTagPresence(search, mode))}
            hasLabel={t("Has tags")}
            missingLabel={t("No tags")}
          />
        ),
        body: (
          <TagsFilterBody
            tree={data.tree}
            search={search}
            onSearchChange={onSearchChange}
          />
        ),
      };
    case "categories":
      return {
        presenceControl: (
          <FacetPresenceToggle
            value={search.categoryPresence}
            onChange={mode => onSearchChange(withCategoryPresence(search, mode))}
            excludeLabel={t("Excludes selected categories")}
            onlyExclude
          />
        ),
        body: (
          <CategoryFilterBody
            categories={data.categories}
            search={search}
            onSearchChange={onSearchChange}
          />
        ),
      };
    case "media-types":
      return {
        presenceControl: (
          <FacetPresenceToggle
            value={search.mediaTypePresence}
            onChange={mode => onSearchChange(withMediaTypePresence(search, mode))}
            excludeLabel={t("Excludes selected media types")}
            onlyExclude
          />
        ),
        body: (
          <MediaTypeFilterBody
            mediaTypes={data.mediaTypes}
            search={search}
            onSearchChange={onSearchChange}
          />
        ),
      };
    case "channels":
      return {
        presenceControl: (
          <FacetPresenceToggle
            value={search.youtubeChannelPresence}
            onChange={mode => onSearchChange(withYouTubeChannelPresence(search, mode))}
            hasLabel={t("Has value")}
            missingLabel={t("No value")}
          />
        ),
        body: (
          <YouTubeChannelFilterBody
            youtubeChannels={data.youtubeChannels}
            search={search}
            onSearchChange={onSearchChange}
          />
        ),
      };
    case "websites":
      return {
        presenceControl: (
          <FacetPresenceToggle
            value={search.websitePresence}
            onChange={mode => onSearchChange(withWebsitePresence(search, mode))}
            hasLabel={t("Has value")}
            missingLabel={t("No value")}
          />
        ),
        body: (
          <WebsiteFilterBody
            websites={data.websites}
            search={search}
            onSearchChange={onSearchChange}
          />
        ),
      };
    case "relationship-types":
      return {
        body: (
          <RelationshipTypeFilterBody
            relationshipTypes={data.relationshipTypes}
            search={search}
            onSearchChange={onSearchChange}
          />
        ),
      };
    case "people":
      return {
        presenceControl: (
          <FacetPresenceToggle
            value={search.peoplePresence}
            onChange={mode => onSearchChange(withPeoplePresence(search, mode))}
            hasLabel={t("Has any")}
            missingLabel={t("Has none")}
          />
        ),
        body: (
          <PersonFilterBody
            people={data.people}
            search={search}
            onSearchChange={onSearchChange}
          />
        ),
      };
    case "place-types":
      return {
        presenceControl: (
          <FacetPresenceToggle
            value={search.placeTypePresence}
            onChange={mode => onSearchChange(withPlaceTypePresence(search, mode))}
            hasLabel={t("Has place type")}
            missingLabel={t("No place type")}
          />
        ),
        body: (
          <PlaceTypeFilterBody
            placeTypes={data.placeTypes}
            search={search}
            onSearchChange={onSearchChange}
          />
        ),
      };
    case "genre-moods":
      return {
        presenceControl: (
          <FacetPresenceToggle
            value={search.genreMoodPresence}
            onChange={mode => onSearchChange(withGenreMoodPresence(search, mode))}
            hasLabel={t("Has any")}
            missingLabel={t("Has none")}
          />
        ),
        body: (
          <GenreMoodFilterBody
            genreMoods={data.genreMoods}
            search={search}
            onSearchChange={onSearchChange}
          />
        ),
      };
    case "sections":
      return {
        presenceControl: (
          <FacetPresenceToggle
            value={search.sectionsPresence}
            onChange={mode => onSearchChange(withSectionsPresence(search, mode))}
            hasLabel={t("Has sections")}
            missingLabel={t("No sections")}
          />
        ),
        body: (
          <SectionsFilterBody
            search={search}
            onSearchChange={onSearchChange}
          />
        ),
      };
    case "media-source":
      return {
        presenceControl: (
          <FacetPresenceToggle
            value={search.mediaSourcePresence}
            onChange={mode => onSearchChange(withMediaSourcePresence(search, mode === "exclude" ? undefined : mode))}
            hasLabel={t("Linked to a media source")}
            missingLabel={t("Not linked")}
            hideExclude
          />
        ),
        body: null,
      };
  }
}

/**
 * The "pills" filter placement: a row of pills under the search bar, one per visible registry facet,
 * plus the sidebar's remaining sections in pill form. Visibility reuses the sidebar's on-demand gating
 * (`computeFilterVisibility`) — an on-demand facet/property gets no pill until it has an active
 * selection or the trailing "Add filter" pill reveals it for the session. Saved filters lead the row
 * (its own self-managed trigger, not wrapped in a popover); custom-property pills and the
 * self-gated language-usage pill follow the standard facets.
 */
export function FilterPillsRow(props: FilterPillsRowProps) {
  const {
    bookmarks, search, onSearchChange,
  } = props;
  const {
    orderedItems, addableFilters, revealFilter, ctx, t,
  } = useFilterPillsRow(props);

  if (orderedItems.length === 0 && addableFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SavedFiltersSection
        search={search}
        onSearchChange={onSearchChange}
        compact
      />

      {orderedItems.map((item) => {
        if (item.kind === "property") {
          return (
            <PropertyFilterPill
              key={item.key}
              property={item.property}
              bookmarks={bookmarks}
              search={search}
              onSearchChange={onSearchChange}
            />
          );
        }
        const {
          presenceControl, body,
        } = renderFacetBody(item.facet.key, ctx);
        return (
          <FilterPill
            key={item.key}
            label={item.facet.label}
            active={facetHasActiveSelection(item.facet.key, search)}
            summary={facetSelectionSummary(item.facet.key, search)}
            presenceControl={presenceControl}
          >
            {body}
          </FilterPill>
        );
      })}

      <LanguageUsageFilterPill
        search={search}
        onSearchChange={onSearchChange}
      />

      {addableFilters.length > 0
        ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Badge
                asChild
                variant="outline"
                className="cursor-pointer gap-1 text-muted-foreground"
              >
                <button type="button">
                  <Plus className="size-3.5" />
                  {t("Add filter")}
                </button>
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {addableFilters.map(item => (
                <DropdownMenuItem
                  key={item.key}
                  onSelect={() => revealFilter(item.key)}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )
        : null}
    </div>
  );
}
