import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, Category, CustomProperty, MediaType, PropertyGroup, TagNode, YouTubeChannel } from "@eesimple/types";

import { useState } from "react";

import { ChevronDown, ChevronUp, PanelRight } from "lucide-react";

import { FilterSections } from "./FilterSidebarSections";
import { usePanelControls } from "./panel/usePanelControls";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  /** Bookmarks in view, used to derive slider bounds when a property has no min/max. */
  bookmarks: Pick<Bookmark, "numberValues">[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/** Left filter rail for the search pages: tiered tags plus custom-property filters. */
export function FilterSidebar({
  tree, properties, propertyGroups, categories, mediaTypes, youtubeChannels, bookmarks, search, onSearchChange,
}: FilterSidebarProps) {
  const [open, setOpen] = useState(false);
  const {
    openType,
  } = usePanelControls();

  // Category data is only supplied on the overall Bookmarks page; category pages render flat.
  const hasCategoryFilter = (categories?.length ?? 0) > 0;
  const hasMediaTypeFilter = (mediaTypes?.length ?? 0) > 0;
  const hasChannelFilter = (youtubeChannels?.length ?? 0) > 0;

  const enabledProperties = properties.filter(p => p.enabled);

  const hasTags = tree.length > 0;
  const hasProperties = enabledProperties.length > 0;
  const hasFilters
    = hasTags || hasProperties || hasCategoryFilter || hasMediaTypeFilter || hasChannelFilter;

  return (
    <aside className="space-y-3">
      {hasFilters
        ? (
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setOpen(prev => !prev)}
              className="
                flex flex-1 items-center justify-between rounded-md px-2 py-1
                text-sm font-semibold transition-colors
                hover:bg-accent
                lg:hidden
              "
            >
              Filters
              {open
                ? <ChevronUp className="size-4" />
                : <ChevronDown className="size-4" />}
            </button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="
                hidden shrink-0 gap-1.5 text-xs text-muted-foreground
                lg:flex
              "
              onClick={() => openType("filters")}
            >
              <PanelRight className="size-3.5" />
              Send to Drawer
            </Button>
          </div>
        )
        : null}

      {!hasFilters
        ? <p className="text-sm text-muted-foreground">No filters available yet.</p>
        : null}

      <div className={cn("space-y-8", !open && "hidden", "lg:block")}>
        <FilterSections
          tree={tree}
          enabledProperties={enabledProperties}
          propertyGroups={propertyGroups}
          categories={categories}
          mediaTypes={mediaTypes}
          youtubeChannels={youtubeChannels}
          bookmarks={bookmarks}
          search={search}
          onSearchChange={onSearchChange}
          hasTags={hasTags}
          hasProperties={hasProperties}
          hasCategoryFilter={hasCategoryFilter}
          hasMediaTypeFilter={hasMediaTypeFilter}
          hasChannelFilter={hasChannelFilter}
        />
      </div>
    </aside>
  );
}
