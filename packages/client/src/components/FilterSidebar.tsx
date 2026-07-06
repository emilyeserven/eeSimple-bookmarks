import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Person, Bookmark, Category, CustomProperty, GenreMood, MediaType, PlaceType, PropertyGroup, RelationshipType, TagNode, Website, YouTubeChannel } from "@eesimple/types";

import { useState } from "react";

import { ChevronDown, Plus, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FilterSections } from "./FilterSidebarSections";
import { SavedFiltersSection } from "./SavedFiltersSection";
import { useOnDemandFilters } from "../hooks/useAppSettings";
import { computeFilterVisibility } from "../lib/filterVisibility";

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
  /** People offered as a multi-select filter; rendered only when non-empty. */
  people?: Person[];
  /** Place types offered as a multi-select filter; rendered only when non-empty. */
  placeTypes?: PlaceType[];
  /** Genres & Moods offered as a multi-select filter; rendered only when non-empty. */
  genreMoods?: GenreMood[];
  /** Bookmarks in view, used to derive slider bounds when a property has no min/max. */
  bookmarks: Pick<Bookmark, "numberValues">[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/** Left filter rail for the search pages: tiered tags plus custom-property filters. */
export function FilterSidebar({
  tree, properties, propertyGroups, categories, mediaTypes, youtubeChannels, websites, relationshipTypes, people, placeTypes, genreMoods, bookmarks, search, onSearchChange,
}: FilterSidebarProps) {
  const {
    t,
  } = useTranslation();
  const [sectionFilter, setSectionFilter] = useState("");
  // Filters configured as "on demand" (Settings → Display → Filters) are hidden until the user adds
  // them from the "Add filter" control; `added` tracks the ones revealed this session.
  const onDemand = useOnDemandFilters();
  const [added, setAdded] = useState<Set<string>>(new Set());
  const revealFilter = (key: string) => setAdded(prev => new Set(prev).add(key));

  const {
    hasFilters, facetVisible, visibleProperties, addableFilters,
  } = computeFilterVisibility({
    tree,
    properties,
    categories,
    mediaTypes,
    youtubeChannels,
    websites,
    relationshipTypes,
    people,
    placeTypes,
    genreMoods,
  }, search, onDemand, added);
  const hasProperties = visibleProperties.length > 0;

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
          {t("Filters")}
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
                  <h2 className="text-sm font-semibold">{t("Filters")}</h2>

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
                      placeholder={t("Search filters…")}
                      className="h-8 pr-7 pl-8 text-xs"
                    />
                    {sectionFilter
                      ? (
                        <button
                          type="button"
                          aria-label={t("Clear filter search")}
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
                          {t("Add filter")}
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
                    people={people}
                    placeTypes={placeTypes}
                    genreMoods={genreMoods}
                    bookmarks={bookmarks}
                    search={search}
                    onSearchChange={onSearchChange}
                    hasTags={facetVisible.tags}
                    hasProperties={hasProperties}
                    hasCategoryFilter={facetVisible.categories}
                    hasMediaTypeFilter={facetVisible["media-types"]}
                    hasChannelFilter={facetVisible.channels}
                    hasWebsiteFilter={facetVisible.websites}
                    hasRelationshipTypeFilter={facetVisible["relationship-types"]}
                    hasPersonFilter={facetVisible.people}
                    hasPlaceTypeFilter={facetVisible["place-types"]}
                    hasGenreMoodFilter={facetVisible["genre-moods"]}
                    hasSectionsFilter={facetVisible.sections}
                    sectionFilter={sectionFilter}
                  />
                </>
              )
              : <p className="text-sm text-muted-foreground">{t("No filters available yet.")}</p>}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </aside>
  );
}
