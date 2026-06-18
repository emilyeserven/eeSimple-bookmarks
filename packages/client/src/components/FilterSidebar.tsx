import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, Category, CustomProperty, TagNode } from "@eesimple/types";

import { useState } from "react";

import { Ban, ChevronDown, ChevronUp, Circle, CircleDot, TriangleAlert } from "lucide-react";

import { CustomPropertyFilters } from "./CustomPropertyFilters";
import { MultiCombobox } from "./MultiCombobox";
import { TagTreeFilter } from "./TagTreeFilter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Separator } from "./ui/separator";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  withBooleanFilter,
  withCategories,
  withNumberFilter,
  withPresenceFilter,
  withTag,
  withTagPresence,
} from "../lib/bookmarkSearch";

import { cn } from "@/lib/utils";

interface FilterSidebarProps {
  tree: TagNode[];
  properties: CustomProperty[];
  /**
   * When provided, shows a multi-select Category filter and per-property category tooltips.
   * Only the Bookmarks page passes this; category pages render flat without it.
   */
  categories?: Category[];
  /** Bookmarks in view, used to derive slider bounds when a property has no min/max. */
  bookmarks: Pick<Bookmark, "numberValues">[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

const collapseWhenInactive = `
  w-0 min-w-0 overflow-hidden p-0 opacity-0
  transition-all duration-150
  group-hover/presence:w-7 group-hover/presence:opacity-100 group-hover/presence:p-1.5
`;

/** Left filter rail for the search pages: tiered tags plus custom-property filters. */
export function FilterSidebar({
  tree, properties, categories, bookmarks, search, onSearchChange,
}: FilterSidebarProps) {
  const [open, setOpen] = useState(false);

  // Category data is only supplied on the overall Bookmarks page; category pages render flat.
  const hasCategoryFilter = (categories?.length ?? 0) > 0;

  const hasTags = tree.length > 0;
  const hasProperties = properties.length > 0;
  const hasFilters = hasTags || hasProperties || hasCategoryFilter;

  const tagFilterActive = search.tag !== undefined || search.tagPresence !== undefined;
  const tagToggleValue = search.tagPresence ?? "any";
  const categoryOptions = (categories ?? []).map(category => ({
    value: category.id,
    label: category.name,
  }));
  const selectedCategories = search.categories ?? [];
  // A property assigned to no category is almost certainly orphaned; flag it as an error.
  const unassignedProperties = hasCategoryFilter
    ? properties.filter(property => property.categoryIds.length === 0)
    : [];

  const numberFilterChange = (propertyId: string, range: [number, number] | undefined) =>
    onSearchChange(withNumberFilter(search, propertyId, range));
  const booleanFilterChange = (propertyId: string, value: boolean | undefined) =>
    onSearchChange(withBooleanFilter(search, propertyId, value));
  const presenceFilterChange = (propertyId: string, mode: "has" | "missing" | undefined) =>
    onSearchChange(withPresenceFilter(search, propertyId, mode));
  const propertyReset = (propertyId: string) =>
    onSearchChange(
      withNumberFilter(
        withBooleanFilter(
          withPresenceFilter(search, propertyId, undefined),
          propertyId,
          undefined,
        ),
        propertyId,
        undefined,
      ),
    );

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
              : <ChevronDown className="size-4" />}
          </button>
        )
        : null}

      {!hasTags && !hasProperties
        ? <p className="text-sm text-muted-foreground">No filters available yet.</p>
        : null}

      <div className={cn("space-y-8", !open && "hidden", "lg:block")}>
        {hasTags
          ? (
            <Collapsible
              defaultOpen
              className="group/tags space-y-3"
            >
              <div className="flex items-center justify-between">
                <CollapsibleTrigger
                  className="
                    flex items-center gap-1.5 text-sm font-semibold
                    hover:text-foreground
                  "
                >
                  <ChevronDown
                    className="
                      size-3.5 shrink-0 transition-transform
                      group-data-[state=open]/tags:rotate-180
                    "
                  />
                  Tags
                </CollapsibleTrigger>
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={tagToggleValue}
                  onValueChange={(v) => {
                    const mode = v === "any" || v === "" ? undefined : v as "has" | "missing";
                    onSearchChange(withTagPresence(search, mode));
                  }}
                  className="group/presence"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="any"
                        aria-label="Any"
                        className={cn(tagToggleValue !== "any" && collapseWhenInactive)}
                      >
                        <Circle className="size-3.5" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Any</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="has"
                        aria-label="Has tags"
                        className={cn(tagToggleValue !== "has" && collapseWhenInactive)}
                      >
                        <CircleDot className="size-3.5" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Has tags</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="missing"
                        aria-label="No tags"
                        className={cn(tagToggleValue !== "missing" && collapseWhenInactive)}
                      >
                        <Ban className="size-3.5" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>No tags</TooltipContent>
                  </Tooltip>
                </ToggleGroup>
              </div>

              <CollapsibleContent className="space-y-3">
                {search.tagPresence !== "missing"
                  ? (
                    <TagTreeFilter
                      tree={tree}
                      activeId={search.tag}
                      onSelect={tag => onSearchChange(withTag(search, tag))}
                    />
                  )
                  : null}

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
              </CollapsibleContent>
            </Collapsible>
          )
          : null}

        {hasTags && (hasCategoryFilter || hasProperties) ? <Separator /> : null}

        {hasCategoryFilter
          ? (
            <Collapsible
              defaultOpen
              className="group/category space-y-3"
            >
              <CollapsibleTrigger
                className="
                  flex items-center gap-1.5 text-sm font-semibold
                  hover:text-foreground
                "
              >
                <ChevronDown
                  className="
                    size-3.5 shrink-0 transition-transform
                    group-data-[state=open]/category:rotate-180
                  "
                />
                Category
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3">
                <MultiCombobox
                  options={categoryOptions}
                  values={selectedCategories}
                  onValuesChange={ids => onSearchChange(withCategories(search, ids))}
                  placeholder="All categories"
                  aria-label="Filter by category"
                />
                {selectedCategories.length > 0
                  ? (
                    <button
                      type="button"
                      className="
                        text-xs text-primary
                        hover:underline
                      "
                      onClick={() => onSearchChange(withCategories(search, []))}
                    >
                      Reset
                    </button>
                  )
                  : null}
              </CollapsibleContent>
            </Collapsible>
          )
          : null}

        {hasCategoryFilter && hasProperties ? <Separator /> : null}

        {hasProperties
          ? (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Properties</h2>
              <CustomPropertyFilters
                properties={properties}
                categories={categories}
                selectedCategoryIds={selectedCategories}
                bookmarks={bookmarks}
                numberValues={search.num ?? {}}
                booleanValues={search.bool ?? {}}
                presenceValues={search.presence ?? {}}
                onNumberFilterChange={numberFilterChange}
                onBooleanFilterChange={booleanFilterChange}
                onPresenceFilterChange={presenceFilterChange}
                onPropertyReset={propertyReset}
              />
              {unassignedProperties.length > 0
                ? (
                  <div className="space-y-1 text-xs text-destructive">
                    <p className="flex items-center gap-1.5 font-medium">
                      <TriangleAlert className="size-3.5 shrink-0" />
                      {unassignedProperties.length === 1
                        ? "1 property isn't assigned to a category"
                        : `${unassignedProperties.length} properties aren't assigned to a category`}
                    </p>
                    <p>{unassignedProperties.map(property => property.name).join(", ")}</p>
                  </div>
                )
                : null}
            </div>
          )
          : null}
      </div>
    </aside>
  );
}
