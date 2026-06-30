import type { Bookmark, Category, CustomProperty, PropertyGroup } from "@eesimple/types";

import { Ban, ChevronDown, Circle, CircleDot, CircleHelp, CircleMinus } from "lucide-react";

import {
  BooleanFilterControl,
  ChoicesFilterControl,
  DateTimeFilterControl,
  NumberFilterControl,
} from "./CustomPropertyFilterControls";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CustomPropertyFiltersProps {
  properties: CustomProperty[];
  /** Property groups; when a property belongs to one, its filter renders under that group's heading. */
  propertyGroups?: PropertyGroup[];
  /** When provided, each property shows a tooltip naming the categories it belongs to. */
  categories?: Category[];
  /**
   * When provided, properties whose categories have no overlap with this set are dimmed,
   * collapsed, and moved to the bottom. Global properties (no categoryIds) are unaffected.
   */
  selectedCategoryIds?: string[];
  /** When provided, only properties whose name contains this substring (case-insensitive) are shown. */
  nameFilter?: string;
  /** Bookmarks in view, used to derive slider bounds when a property has no min/max. */
  bookmarks: Pick<Bookmark, "numberValues">[];
  /** Active number-range filters keyed by property id (absent = no filter / full range). */
  numberValues: Record<string, [number, number]>;
  /** Active boolean filters keyed by property id (absent = no filter). */
  booleanValues: Record<string, boolean>;
  /** Active date/time range filters (`[from, to]`, either `null`) keyed by property id. */
  dateTimeValues: Record<string, [string | null, string | null]>;
  /** Active presence filters keyed by property id (absent = no filter). "exclude" is valid for choices-type properties. */
  presenceValues: Record<string, "has" | "missing" | "exclude">;
  /** Active choices filters keyed by property id; value is an array of selected choice slugs. */
  choicesValues: Record<string, string[]>;
  /** Report a number filter (or `undefined` to clear it when back at full range). */
  onNumberFilterChange: (propertyId: string, range: [number, number] | undefined) => void;
  /** Report a boolean filter (`true`/`false`, or `undefined` to clear it). */
  onBooleanFilterChange: (propertyId: string, value: boolean | undefined) => void;
  /** Report a date/time range filter (`[from, to]`, or `undefined` to clear it). */
  onDateTimeFilterChange: (propertyId: string, range: [string | null, string | null] | undefined) => void;
  /** Report a presence filter (`"has"`/`"missing"`/`"exclude"`, or `undefined` to clear it). */
  onPresenceFilterChange: (propertyId: string, mode: "has" | "missing" | "exclude" | undefined) => void;
  /** Report a choices filter (array of selected choice slugs, or empty to clear). */
  onChoicesFilterChange: (propertyId: string, values: string[]) => void;
  /** Clear all filter types (num, bool, presence, choices) for a property in one navigation. */
  onPropertyReset: (propertyId: string) => void;
}

/**
 * Number, calculate, and rating-scale properties share the range-slider control; all live in
 * numberValues.
 */
function isRangeProperty(property: CustomProperty): boolean {
  return property.type === "number" || property.type === "calculate" || property.type === "ratingScale";
}

/** Resolve a property's slider bounds, falling back to the data range when a bound is null. */
function effectiveBounds(
  property: CustomProperty,
  bookmarks: Pick<Bookmark, "numberValues">[],
): [number, number] {
  // Rating scales have fixed bounds: 0/1 up to the configured max.
  if (property.type === "ratingScale") {
    return [property.ratingAllowZero ? 0 : 1, property.ratingMax ?? 5];
  }
  const values = bookmarks
    .flatMap(bookmark => bookmark.numberValues)
    .filter(value => value.propertyId === property.id)
    .map(value => value.value);
  const dataMin = values.length > 0 ? Math.min(...values) : 0;
  const dataMax = values.length > 0 ? Math.max(...values) : 100;
  const min = property.numberMin ?? dataMin;
  const max = property.numberMax ?? dataMax;
  // A slider needs a non-empty range; nudge the max when bounds collapse.
  return [min, max > min ? max : min + 1];
}

const collapseWhenInactive = `
  w-0 min-w-0 overflow-hidden px-0 opacity-0
  transition-all duration-150
  group-hover/presence:w-7 group-hover/presence:opacity-100 group-hover/presence:px-1.5
`;

interface PresenceControlProps {
  propertyId: string;
  value: "has" | "missing" | "exclude" | undefined;
  onChange: (propertyId: string, mode: "has" | "missing" | "exclude" | undefined) => void;
  /** When true, a 4th "Excludes selected values" option is shown. Only meaningful for choices-type properties. */
  supportsExclude?: boolean;
}

function PresenceFilterControl({
  propertyId, value, onChange, supportsExclude = false,
}: PresenceControlProps) {
  const toggleValue = value ?? "any";

  function handleChange(next: string) {
    if (next === "any" || next === "") {
      onChange(propertyId, undefined);
    }
    else {
      onChange(propertyId, next as "has" | "missing" | "exclude");
    }
  }

  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={toggleValue}
      onValueChange={handleChange}
      className="group/presence gap-0 rounded-sm ring-1 ring-border"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem
            value="any"
            aria-label="Any"
            className={cn(toggleValue !== "any" && collapseWhenInactive)}
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
            aria-label="Has value"
            className={cn(toggleValue !== "has" && collapseWhenInactive)}
          >
            <CircleDot className="size-3.5" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>Has value</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem
            value="missing"
            aria-label="No value"
            className={cn(toggleValue !== "missing" && collapseWhenInactive)}
          >
            <Ban className="size-3.5" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>No value</TooltipContent>
      </Tooltip>
      {supportsExclude
        ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="exclude"
                aria-label="Excludes selected values"
                className={cn(toggleValue !== "exclude" && collapseWhenInactive)}
              >
                <CircleMinus className="size-3.5" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>Excludes selected values</TooltipContent>
          </Tooltip>
        )
        : null}
    </ToggleGroup>
  );
}

/** Renders one dynamic filter control per custom property in the filter sidebar. */
export function CustomPropertyFilters({
  properties,
  propertyGroups = [],
  categories,
  selectedCategoryIds,
  bookmarks,
  numberValues,
  booleanValues,
  dateTimeValues,
  presenceValues,
  choicesValues,
  onNumberFilterChange,
  onBooleanFilterChange,
  onDateTimeFilterChange,
  onPresenceFilterChange,
  onChoicesFilterChange,
  onPropertyReset,
  nameFilter,
}: CustomPropertyFiltersProps) {
  if (properties.length === 0) return null;

  const categoryName = new Map((categories ?? []).map(category => [category.id, category.name]));

  /**
   * A property is "active" (relevant to the current category filter) when:
   * - no category filter is active, OR
   * - the property is global (no categoryIds), OR
   * - at least one of its categories is selected.
   * Global properties are never dimmed because they aren't tied to any category.
   */
  function isPropertyActive(property: CustomProperty): boolean {
    if (!selectedCategoryIds?.length) return true;
    if (property.allCategories || property.categoryIds.length === 0) return true;
    return property.categoryIds.some(id => selectedCategoryIds.includes(id));
  }

  // Inactive properties sort to the bottom; stable order preserved within each group.
  const sorted = selectedCategoryIds?.length
    ? [...properties].sort((a, b) => {
      const aActive = isPropertyActive(a);
      const bActive = isPropertyActive(b);
      if (aActive === bActive) return 0;
      return aActive ? -1 : 1;
    })
    : properties;

  // Apply name filter when provided by the sidebar search box.
  const visible = nameFilter
    ? sorted.filter(p => p.name.toLowerCase().includes(nameFilter.toLowerCase()))
    : sorted;

  /** Render one property's collapsible filter control (unchanged from the flat layout). */
  function renderProperty(property: CustomProperty) {
    const isActive = isPropertyActive(property);
    const presenceValue = presenceValues[property.id];
    const isFilterActive
      = numberValues[property.id] !== undefined
        || booleanValues[property.id] !== undefined
        || dateTimeValues[property.id] !== undefined
        || presenceValue !== undefined
        || (choicesValues[property.id]?.length ?? 0) > 0;

    function handleReset() {
      onPropertyReset(property.id);
    }

    return (
      <Collapsible
        key={`${property.id}-${String(isActive)}`}
        defaultOpen={isActive}
        className={cn("group/prop space-y-3", !isActive && "opacity-50")}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1">
            <CollapsibleTrigger
              disabled={!isActive}
              className="
                flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground
                hover:text-foreground
              "
            >
              <ChevronDown
                className="
                  size-3 shrink-0 transition-transform
                  group-data-[state=open]/prop:rotate-180
                "
              />
              <Label className="cursor-pointer truncate text-xs">{property.name}</Label>
            </CollapsibleTrigger>
            {/* Tooltip kept interactive regardless of active state (user can still check which categories a property belongs to). */}
            {categories && property.categoryIds.length > 0
              ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Associated categories"
                      className="
                        shrink-0 text-muted-foreground
                        hover:text-foreground
                      "
                    >
                      <CircleHelp className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {property.categoryIds
                      .map(id => categoryName.get(id) ?? id)
                      .join(", ")}
                  </TooltipContent>
                </Tooltip>
              )
              : null}
          </div>
          <div className={cn(!isActive && "pointer-events-none")}>
            <PresenceFilterControl
              propertyId={property.id}
              value={presenceValue}
              onChange={onPresenceFilterChange}
              supportsExclude={property.type === "choices"}
            />
          </div>
        </div>

        <CollapsibleContent
          className={cn("space-y-3", !isActive && "pointer-events-none")}
        >
          {presenceValue !== "missing" && presenceValue !== "exclude" && isRangeProperty(property)
            ? (
              <NumberFilterControl
                property={property}
                bounds={effectiveBounds(property, bookmarks)}
                value={numberValues[property.id]}
                onChange={onNumberFilterChange}
              />
            )
            : null}

          {presenceValue !== "missing" && presenceValue !== "exclude" && property.type === "datetime"
            ? (
              <DateTimeFilterControl
                property={property}
                value={dateTimeValues[property.id]}
                onChange={onDateTimeFilterChange}
              />
            )
            : null}

          {presenceValue !== "missing" && presenceValue !== "exclude" && property.type === "boolean"
            ? (
              <BooleanFilterControl
                property={property}
                value={booleanValues[property.id]}
                onChange={onBooleanFilterChange}
              />
            )
            : null}

          {presenceValue !== "missing" && property.type === "choices"
            ? (
              <ChoicesFilterControl
                property={property}
                value={choicesValues[property.id]}
                onChange={onChoicesFilterChange}
              />
            )
            : null}

          {isFilterActive
            ? (
              <button
                type="button"
                onClick={handleReset}
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

  // Partition properties by group. Groups with members render first (ordered by priority then
  // name) under their own heading; ungrouped properties (or those whose group is unknown) fall into
  // a trailing bucket. When there are no group sections at all, the bucket renders headingless to
  // preserve the original flat layout.
  const knownGroupIds = new Set(propertyGroups.map(group => group.id));
  const inGroup = (property: CustomProperty, target: string | null): boolean =>
    target === null
      ? property.propertyGroupId === null || !knownGroupIds.has(property.propertyGroupId)
      : property.propertyGroupId === target;
  const sortedGroups = [...propertyGroups]
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  const groupSections = sortedGroups
    .map(group => ({
      key: group.id,
      title: group.name,
      items: visible.filter(property => inGroup(property, group.id)),
    }))
    .filter(section => section.items.length > 0);
  const ungrouped = visible.filter(property => inGroup(property, null));

  // No groups in play → render the original flat list.
  if (groupSections.length === 0) {
    return (
      <div className="space-y-10">
        {ungrouped.map(renderProperty)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupSections.map(section => (
        <div
          key={section.key}
          className="space-y-3"
        >
          <h3 className="text-sm font-semibold">{section.title}</h3>
          <div className="space-y-10">
            {section.items.map(renderProperty)}
          </div>
        </div>
      ))}
      {ungrouped.length > 0
        ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Other</h3>
            <div className="space-y-10">
              {ungrouped.map(renderProperty)}
            </div>
          </div>
        )
        : null}
    </div>
  );
}
