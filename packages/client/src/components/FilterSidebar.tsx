import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, CustomProperty, TagNode } from "@eesimple/types";

import { CustomPropertyFilters } from "./CustomPropertyFilters";
import { TagTreeFilter } from "./TagTreeFilter";
import {
  withBooleanFilter,
  withNumberFilter,
  withTag,
} from "../lib/bookmarkSearch";

interface FilterSidebarProps {
  tree: TagNode[];
  properties: CustomProperty[];
  /** Bookmarks in view, used to derive slider bounds when a property has no min/max. */
  bookmarks: Pick<Bookmark, "numberValues">[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/** Left filter rail for the search pages: tiered tags plus custom-property filters. */
export function FilterSidebar({
  tree, properties, bookmarks, search, onSearchChange,
}: FilterSidebarProps) {
  const hasTags = tree.length > 0;
  const hasProperties = properties.length > 0;
  if (!hasTags && !hasProperties) return null;

  return (
    <aside className="space-y-6">
      {hasTags
        ? (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Tags</h2>
            <TagTreeFilter
              tree={tree}
              activeId={search.tag}
              onSelect={tag => onSearchChange(withTag(search, tag))}
            />
          </div>
        )
        : null}

      {hasProperties
        ? (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Properties</h2>
            <CustomPropertyFilters
              properties={properties}
              bookmarks={bookmarks}
              numberValues={search.num ?? {}}
              booleanValues={search.bool ?? {}}
              onNumberFilterChange={(propertyId, range) =>
                onSearchChange(withNumberFilter(search, propertyId, range))}
              onBooleanFilterChange={(propertyId, value) =>
                onSearchChange(withBooleanFilter(search, propertyId, value))}
            />
          </div>
        )
        : null}
    </aside>
  );
}
