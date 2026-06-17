import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, Category, CustomProperty, TagNode } from "@eesimple/types";

import { useState } from "react";

import { ChevronDown, ChevronUp } from "lucide-react";

import { CustomPropertyFilters } from "./CustomPropertyFilters";
import { TagTreeFilter } from "./TagTreeFilter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import {
  withBooleanFilter,
  withNumberFilter,
  withPresenceFilter,
  withTag,
  withTagPresence,
} from "../lib/bookmarkSearch";

import { cn } from "@/lib/utils";

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

const presenceButton = "rounded-md px-2 py-0.5 text-xs transition-colors";
const presenceActive = "bg-primary text-primary-foreground";
const presenceInactive = "text-foreground hover:bg-accent hover:text-accent-foreground";

/** Left filter rail for the search pages: tiered tags plus custom-property filters. */
export function FilterSidebar({
  tree, properties, categories, bookmarks, search, onSearchChange,
}: FilterSidebarProps) {
  const [open, setOpen] = useState(false);

  const hasTags = tree.length > 0;
  const hasProperties = properties.length > 0;
  const hasFilters = hasTags || hasProperties;

  const tagFilterActive = search.tag !== undefined || search.tagPresence !== undefined;

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
  const presenceFilterChange = (propertyId: string, mode: "has" | "missing" | undefined) =>
    onSearchChange(withPresenceFilter(search, propertyId, mode));

  return (
    <aside className="space-y-3">
      {hasFilters
        ? (
          <button
            type="button"
            onClick={() => setOpen(prev => !prev)}
            className="
              flex w-full items-center justify-between rounded-md px-2 py-1
              text-sm font-semibold transition-colors
              hover:bg-accent
              lg:hidden
            "
          >
            Filters
            {open
              ? <ChevronUp className="size-4" />
              : (
                <ChevronDown
                  className="size-4"
                />
              )}
          </button>
        )
        : null}

      {!hasTags && !hasProperties
        ? <p className="text-sm text-muted-foreground">No filters available yet.</p>
        : null}

      <div className={cn("space-y-6", !open && "hidden", "lg:block")}>
        {hasTags
          ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Tags</h2>
                {tagFilterActive
                  ? (
                    <button
                      type="button"
                      onClick={() => onSearchChange(withTag(withTagPresence(search, undefined), undefined))}
                      className="
                        text-xs text-primary
                        hover:underline
                      "
                    >
                      Reset
                    </button>
                  )
                  : null}
              </div>

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onSearchChange(withTagPresence(search, undefined))}
                  className={cn(presenceButton, search.tagPresence === undefined ? presenceActive : presenceInactive)}
                >
                  Any
                </button>
                <button
                  type="button"
                  onClick={() => onSearchChange(withTagPresence(search, "has"))}
                  className={cn(presenceButton, search.tagPresence === "has" ? presenceActive : presenceInactive)}
                >
                  Has tags
                </button>
                <button
                  type="button"
                  onClick={() => onSearchChange(withTagPresence(search, "missing"))}
                  className={cn(presenceButton, search.tagPresence === "missing" ? presenceActive : presenceInactive)}
                >
                  No tags
                </button>
              </div>

              {search.tagPresence !== "missing"
                ? (
                  <TagTreeFilter
                    tree={tree}
                    activeId={search.tag}
                    onSelect={tag => onSearchChange(withTag(search, tag))}
                  />
                )
                : null}
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
                    presenceValues={search.presence ?? {}}
                    onNumberFilterChange={numberFilterChange}
                    onBooleanFilterChange={booleanFilterChange}
                    onPresenceFilterChange={presenceFilterChange}
                  />
                )
                : null}

              {categoryGroups.map(({
                category, props,
              }) => (
                <Collapsible
                  key={category.id}
                  className="group/cat space-y-2"
                  defaultOpen={false}
                >
                  <CollapsibleTrigger
                    className="
                      flex w-full items-center gap-1.5 text-xs font-medium
                      text-muted-foreground
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
                      presenceValues={search.presence ?? {}}
                      onNumberFilterChange={numberFilterChange}
                      onBooleanFilterChange={booleanFilterChange}
                      onPresenceFilterChange={presenceFilterChange}
                    />
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )
          : null}
      </div>
    </aside>
  );
}
