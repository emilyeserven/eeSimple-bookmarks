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
  withDateTimeFilter,
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

/** Left filter rail for the search pages: tiered tags plus custom-property filters. */
export function FilterSidebar({
  tree, properties, categories, bookmarks, search, onSearchChange,
}: FilterSidebarProps) {
  const [open, setOpen] = useState(false);

  // Category data is only supplied on the overall Bookmarks page; category pages render flat.
  const hasCategoryFilter = (categories?.length ?? 0) > 0;

  const enabledProperties = properties.filter(p => p.enabled);

  const hasTags = tree.length > 0;
  const hasProperties = enabledProperties.length > 0;
  const hasFilters = hasTags || hasProperties || hasCategoryFilter;

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
        <FilterSections
          tree={tree}
          enabledProperties={enabledProperties}
          categories={categories}
          bookmarks={bookmarks}
          search={search}
          onSearchChange={onSearchChange}
          hasTags={hasTags}
          hasProperties={hasProperties}
          hasCategoryFilter={hasCategoryFilter}
        />
      </div>
    </aside>
  );
}

/** The filter sections themselves, with separators between adjacent groups. */
function FilterSections({
  tree, enabledProperties, categories, bookmarks, search, onSearchChange,
  hasTags, hasProperties, hasCategoryFilter,
}: {
  tree: TagNode[];
  enabledProperties: CustomProperty[];
  categories?: Category[];
  bookmarks: Pick<Bookmark, "numberValues">[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
  hasTags: boolean;
  hasProperties: boolean;
  hasCategoryFilter: boolean;
}) {
  return (
    <>
      {hasTags
        ? (
          <TagsFilterSection
            tree={tree}
            search={search}
            onSearchChange={onSearchChange}
          />
        )
        : null}

      {hasTags && (hasCategoryFilter || hasProperties) ? <Separator /> : null}

      {hasCategoryFilter
        ? (
          <CategoryFilterSection
            categories={categories}
            search={search}
            onSearchChange={onSearchChange}
          />
        )
        : null}

      {hasCategoryFilter && hasProperties ? <Separator /> : null}

      {hasProperties
        ? (
          <PropertiesFilterSection
            enabledProperties={enabledProperties}
            categories={categories}
            bookmarks={bookmarks}
            search={search}
            onSearchChange={onSearchChange}
            hasCategoryFilter={hasCategoryFilter}
          />
        )
        : null}
    </>
  );
}

const collapseWhenInactive = `
  w-0 min-w-0 overflow-hidden p-0 opacity-0
  transition-all duration-150
  group-hover/presence:w-7 group-hover/presence:opacity-100 group-hover/presence:p-1.5
`;

const tagPresenceOptions = [
  {
    value: "any",
    label: "Any",
    Icon: Circle,
  },
  {
    value: "has",
    label: "Has tags",
    Icon: CircleDot,
  },
  {
    value: "missing",
    label: "No tags",
    Icon: Ban,
  },
] as const;

/** Tiered-tag filter: a presence toggle plus the tag tree, both driving `search`. */
function TagsFilterSection({
  tree, search, onSearchChange,
}: {
  tree: TagNode[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const tagFilterActive = search.tag !== undefined || search.tagPresence !== undefined;
  const tagToggleValue = search.tagPresence ?? "any";

  return (
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
          {tagPresenceOptions.map(({
            value, label, Icon,
          }) => (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value={value}
                  aria-label={label}
                  className={cn(tagToggleValue !== value && collapseWhenInactive)}
                >
                  <Icon className="size-3.5" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
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
  );
}

/** Multi-select category filter; only rendered on the overall Bookmarks page. */
function CategoryFilterSection({
  categories, search, onSearchChange,
}: {
  categories?: Category[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const categoryOptions = (categories ?? []).map(category => ({
    value: category.id,
    label: category.name,
  }));
  const selectedCategories = search.categories ?? [];

  return (
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
  );
}

/** Custom-property filters plus a warning for properties with no category assignment. */
function PropertiesFilterSection({
  enabledProperties, categories, bookmarks, search, onSearchChange, hasCategoryFilter,
}: {
  enabledProperties: CustomProperty[];
  categories?: Category[];
  bookmarks: Pick<Bookmark, "numberValues">[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
  hasCategoryFilter: boolean;
}) {
  const selectedCategories = search.categories ?? [];
  // A property assigned to no category is almost certainly orphaned; flag it as an error.
  const unassignedProperties = hasCategoryFilter
    ? enabledProperties.filter(property => property.categoryIds.length === 0)
    : [];

  const numberFilterChange = (propertyId: string, range: [number, number] | undefined) =>
    onSearchChange(withNumberFilter(search, propertyId, range));
  const booleanFilterChange = (propertyId: string, value: boolean | undefined) =>
    onSearchChange(withBooleanFilter(search, propertyId, value));
  const dateTimeFilterChange = (propertyId: string, range: [string | null, string | null] | undefined) =>
    onSearchChange(withDateTimeFilter(search, propertyId, range));
  const presenceFilterChange = (propertyId: string, mode: "has" | "missing" | undefined) =>
    onSearchChange(withPresenceFilter(search, propertyId, mode));
  const propertyReset = (propertyId: string) =>
    onSearchChange(
      withDateTimeFilter(
        withNumberFilter(
          withBooleanFilter(
            withPresenceFilter(search, propertyId, undefined),
            propertyId,
            undefined,
          ),
          propertyId,
          undefined,
        ),
        propertyId,
        undefined,
      ),
    );

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">Properties</h2>
      <CustomPropertyFilters
        properties={enabledProperties}
        categories={categories}
        selectedCategoryIds={selectedCategories}
        bookmarks={bookmarks}
        numberValues={search.num ?? {}}
        booleanValues={search.bool ?? {}}
        dateTimeValues={search.date ?? {}}
        presenceValues={search.presence ?? {}}
        onNumberFilterChange={numberFilterChange}
        onBooleanFilterChange={booleanFilterChange}
        onDateTimeFilterChange={dateTimeFilterChange}
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
  );
}
