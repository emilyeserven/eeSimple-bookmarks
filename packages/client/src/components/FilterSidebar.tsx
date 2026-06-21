import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, Category, CustomProperty, MediaType, PropertyGroup, RelationshipType, TagNode, Website, YouTubeChannel } from "@eesimple/types";

import { ChevronDown } from "lucide-react";

import { FilterSections } from "./FilterSidebarSections";
import { SavedFiltersSection } from "./SavedFiltersSection";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  /** Bookmarks in view, used to derive slider bounds when a property has no min/max. */
  bookmarks: Pick<Bookmark, "numberValues">[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/** Left filter rail for the search pages: tiered tags plus custom-property filters. */
export function FilterSidebar({
  tree, properties, propertyGroups, categories, mediaTypes, youtubeChannels, websites, relationshipTypes, bookmarks, search, onSearchChange,
}: FilterSidebarProps) {
  // Category data is only supplied on the overall Bookmarks page; category pages render flat.
  const hasCategoryFilter = (categories?.length ?? 0) > 0;
  const hasMediaTypeFilter = (mediaTypes?.length ?? 0) > 0;
  const hasChannelFilter = (youtubeChannels?.length ?? 0) > 0;
  const hasWebsiteFilter = (websites?.length ?? 0) > 0;
  const hasRelationshipTypeFilter = (relationshipTypes?.length ?? 0) > 0;

  const enabledProperties = properties.filter(p => p.enabled);

  const hasTags = tree.length > 0;
  const hasProperties = enabledProperties.length > 0;
  const hasFilters
    = hasTags || hasProperties || hasCategoryFilter || hasMediaTypeFilter || hasChannelFilter || hasWebsiteFilter || hasRelationshipTypeFilter;

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

                  <FilterSections
                    tree={tree}
                    enabledProperties={enabledProperties}
                    propertyGroups={propertyGroups}
                    categories={categories}
                    mediaTypes={mediaTypes}
                    youtubeChannels={youtubeChannels}
                    websites={websites}
                    relationshipTypes={relationshipTypes}
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
