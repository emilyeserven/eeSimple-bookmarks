import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, Category, CustomProperty, TagNode } from "@eesimple/types";

import { ChevronDown } from "lucide-react";

import { CustomPropertyFilters } from "./CustomPropertyFilters";
import { TagTreeFilter } from "./TagTreeFilter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import {
  withBooleanFilter,
  withNumberFilter,
  withTag,
} from "../lib/bookmarkSearch";

interface FilterSidebarProps {
  tree: TagNode[];
  properties: CustomProperty[];
  /** When provided, groups category-specific properties under collapsible sections. */
  categories?: Category[];
  /** Bookmarks in view, used to derive slider bounds when a property has no min/max. */
  bookmarks: Pick<Bookmark, "numberValues">[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/** Left filter rail for the search pages: tiered tags plus custom-property filters. */
export function FilterSidebar({
  tree, properties, categories, bookmarks, search, onSearchChange,
}: FilterSidebarProps) {
  const hasTags = tree.length > 0;
  const hasProperties = properties.length > 0;

  const globalProperties = properties.filter(p => p.categoryIds.length === 0);
  const categoryGroups = categories && categories.length > 0
    ? categories
      .map(cat => ({
        category: cat,
        props: properties.filter(p => p.categoryIds.includes(cat.id)),
      }))
      .filter(group => group.props.length > 0)
    : [];
  const useCategoryGrouping = categoryGroups.length > 0;

  const numberFilterChange = (propertyId: string, range: [number, number] | undefined) =>
    onSearchChange(withNumberFilter(search, propertyId, range));
  const booleanFilterChange = (propertyId: string, value: boolean | undefined) =>
    onSearchChange(withBooleanFilter(search, propertyId, value));

  return (
    <aside className="space-y-6">
      {!hasTags && !hasProperties
        ? <p className="text-sm text-muted-foreground">No filters available yet.</p>
        : null}

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

            {(!useCategoryGrouping || globalProperties.length > 0)
              ? (
                <CustomPropertyFilters
                  properties={useCategoryGrouping ? globalProperties : properties}
                  bookmarks={bookmarks}
                  numberValues={search.num ?? {}}
                  booleanValues={search.bool ?? {}}
                  onNumberFilterChange={numberFilterChange}
                  onBooleanFilterChange={booleanFilterChange}
                />
              )
              : null}

            {categoryGroups.map(({ category, props }) => (
              <Collapsible
                key={category.id}
                className="group/cat space-y-2"
                defaultOpen={false}
              >
                <CollapsibleTrigger
                  className="
                    flex w-full items-center gap-1.5
                    text-xs font-medium text-muted-foreground
                    hover:text-foreground
                  "
                >
                  <ChevronDown
                    className="
                      size-3.5 shrink-0 transition-transform
                      group-data-[state=open]/cat:rotate-180
                    "
                  />
                  {category.name}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pl-5">
                  <CustomPropertyFilters
                    properties={props}
                    bookmarks={bookmarks}
                    numberValues={search.num ?? {}}
                    booleanValues={search.bool ?? {}}
                    onNumberFilterChange={numberFilterChange}
                    onBooleanFilterChange={booleanFilterChange}
                  />
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )
        : null}
    </aside>
  );
}
