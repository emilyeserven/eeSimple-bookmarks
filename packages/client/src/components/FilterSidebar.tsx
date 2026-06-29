import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { FilterFacetKey } from "../lib/filterFacets";
import type { Author, Bookmark, Category, CustomProperty, MediaType, PropertyGroup, RelationshipType, TagNode, Website, YouTubeChannel } from "@eesimple/types";

import { useState } from "react";

import { ChevronDown, Plus, Search, X } from "lucide-react";

import { FilterSections } from "./FilterSidebarSections";
import { SavedFiltersSection } from "./SavedFiltersSection";
import { useOnDemandFilters } from "../hooks/useAppSettings";
import { FILTER_FACETS, facetHasActiveSelection, propertyHasActiveSelection } from "../lib/filterFacets";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface FilterSidebarProps {
  tree: TagNode[];
  properties: CustomProperty[];
  /** Property groups; grouped property filters render under their group's heading. */
  propertyGroups?: PropertyGroup[];
  /**
   * When provided, shows a multi-select Category filter and per-property category tooltips.
   * Only the Bookmarks page passes this; category pages render flat without it.
   */
  categories?: Category[];
  /** Media types offered as a multi-select filter; rendered only when non-empty. */
  mediaTypes?: MediaType[];
  /** YouTube channels offered as a multi-select filter; rendered only when non-empty. */
  youtubeChannels?: YouTubeChannel[];
  /** Websites offered as a multi-select filter; rendered only when non-empty. */
  websites?: Website[];
  /** Relationship types offered as a multi-select filter; rendered only when non-empty. */
  relationshipTypes?: RelationshipType[];
  /** Authors offered as a multi-select filter; rendered only when non-empty. */
  authors?: Author[];
  /** Bookmarks in view, used to derive slider bounds when a property has no min/max. */
  bookmarks: Pick<Bookmark, "numberValues">[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/** Left filter rail for the search pages: tiered tags plus custom-property filters. */
export function FilterSidebar({
  tree, properties, propertyGroups, categories, mediaTypes, youtubeChannels, websites, relationshipTypes, authors, bookmarks, search, onSearchChange,
}: FilterSidebarProps) {
  const [sectionFilter, setSectionFilter] = useState("");
  // Filters configured as "on demand" (Settings → Display → Filters) are hidden until the user adds
  // them from the "Add filter" control; `added` tracks the ones revealed this session.
  const onDemand = useOnDemandFilters();
  const [added, setAdded] = useState<Set<string>>(new Set());
  const revealFilter = (key: string) => setAdded(prev => new Set(prev).add(key));
  // A filter shows when it isn't on-demand, has been added this session, or already has a value.
  const revealed = (key: string, active: boolean) =>
    !onDemand.includes(key) || added.has(key) || active;

  // Data presence (ungated): whether each facet has any data to filter on at all.
  const hasCategoryData = (categories?.length ?? 0) > 0;
  const hasMediaTypeData = (mediaTypes?.length ?? 0) > 0;
  const hasChannelData = (youtubeChannels?.length ?? 0) > 0;
  const hasWebsiteData = (websites?.length ?? 0) > 0;
  const hasRelationshipTypeData = (relationshipTypes?.length ?? 0) > 0;
  const hasAuthorData = (authors?.length ?? 0) > 0;

  const enabledProperties = properties.filter(p => p.enabled);
  const hasTagsData = tree.length > 0;
  const hasSectionsData = enabledProperties.some(p => p.type === "sections");

  // Whether any facet has data — drives the rail's "No filters available" fallback. Ungated so the
  // rail (and its Add-filter control) still appears when every filter is configured on-demand.
  const hasFilters
    = hasTagsData || enabledProperties.length > 0 || hasSectionsData || hasCategoryData
      || hasMediaTypeData || hasChannelData || hasWebsiteData || hasRelationshipTypeData || hasAuthorData;

  // Gated flags passed to the rendered sections: present in data AND currently revealed.
  const facetVisible = (key: FilterFacetKey) => revealed(key, facetHasActiveSelection(key, search));
  const hasTags = hasTagsData && facetVisible("tags");
  const hasCategoryFilter = hasCategoryData && facetVisible("categories");
  const hasMediaTypeFilter = hasMediaTypeData && facetVisible("media-types");
  const hasChannelFilter = hasChannelData && facetVisible("channels");
  const hasWebsiteFilter = hasWebsiteData && facetVisible("websites");
  const hasRelationshipTypeFilter = hasRelationshipTypeData && facetVisible("relationship-types");
  const hasAuthorFilter = hasAuthorData && facetVisible("authors");
  const hasSectionsFilter = hasSectionsData && facetVisible("sections");
  const visibleProperties = enabledProperties.filter(p =>
    revealed(p.id, propertyHasActiveSelection(p.id, search)));
  const hasProperties = visibleProperties.length > 0;

  // The on-demand filters that have data but aren't shown yet — offered in the Add-filter menu.
  const facetData: Record<string, boolean> = {
    "tags": hasTagsData,
    "categories": hasCategoryData,
    "media-types": hasMediaTypeData,
    "channels": hasChannelData,
    "websites": hasWebsiteData,
    "relationship-types": hasRelationshipTypeData,
    "authors": hasAuthorData,
    "sections": hasSectionsData,
  };
  const addableFilters = [
    ...FILTER_FACETS
      .filter(facet =>
        facetData[facet.key]
        && onDemand.includes(facet.key)
        && !added.has(facet.key)
        && !facetHasActiveSelection(facet.key, search))
      .map(facet => ({
        key: facet.key as string,
        label: facet.label,
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

  return (
    <aside>
      <Collapsible
        className="
          group/filters rounded-lg border bg-card p-2
          lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0
        "
      >
        <CollapsibleTrigger
          className="
            flex w-full items-center justify-between rounded-md px-3 py-2
            text-xs font-semibold tracking-wide text-muted-foreground uppercase
            transition-colors
            lg:hidden
          "
        >
          Filters
          <ChevronDown
            className="
              size-4 transition-transform
              group-data-[state=open]/filters:rotate-180
            "
          />
        </CollapsibleTrigger>
        <CollapsibleContent
          forceMount
          className="
            hidden
            data-[state=open]:block
            lg:block
          "
        >
          <div className="space-y-8">
            <SavedFiltersSection
              search={search}
              onSearchChange={onSearchChange}
            />

            {hasFilters
              ? (
                <>
                  <h2 className="text-sm font-semibold">Filters</h2>

                  <div className="relative flex items-center">
                    <Search
                      className="
                        pointer-events-none absolute left-2.5 size-3.5 shrink-0
                        text-muted-foreground
                      "
                    />
                    <Input
                      type="text"
                      value={sectionFilter}
                      onChange={e => setSectionFilter(e.target.value)}
                      placeholder="Search filters…"
                      className="h-8 pr-7 pl-8 text-xs"
                    />
                    {sectionFilter
                      ? (
                        <button
                          type="button"
                          aria-label="Clear filter search"
                          onClick={() => setSectionFilter("")}
                          className="
                            absolute right-2 text-muted-foreground
                            hover:text-foreground
                          "
                        >
                          <X className="size-3.5" />
                        </button>
                      )
                      : null}
                  </div>

                  {addableFilters.length > 0
                    ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="
                            flex items-center gap-1.5 text-xs font-medium
                            text-muted-foreground
                            hover:text-foreground
                          "
                        >
                          <Plus className="size-3.5" />
                          Add filter
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

                  <FilterSections
                    tree={tree}
                    enabledProperties={visibleProperties}
                    propertyGroups={propertyGroups}
                    categories={categories}
                    mediaTypes={mediaTypes}
                    youtubeChannels={youtubeChannels}
                    websites={websites}
                    relationshipTypes={relationshipTypes}
                    authors={authors}
                    bookmarks={bookmarks}
                    search={search}
                    onSearchChange={onSearchChange}
                    hasTags={hasTags}
                    hasProperties={hasProperties}
                    hasCategoryFilter={hasCategoryFilter}
                    hasMediaTypeFilter={hasMediaTypeFilter}
                    hasChannelFilter={hasChannelFilter}
                    hasWebsiteFilter={hasWebsiteFilter}
                    hasRelationshipTypeFilter={hasRelationshipTypeFilter}
                    hasAuthorFilter={hasAuthorFilter}
                    hasSectionsFilter={hasSectionsFilter}
                    sectionFilter={sectionFilter}
                  />
                </>
              )
              : <p className="text-sm text-muted-foreground">No filters available yet.</p>}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </aside>
  );
}
