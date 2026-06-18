import type { ComboboxOption } from "./Combobox";
import type { Bookmark, Category, CustomProperty } from "@eesimple/types";

import { Ban, ChevronDown, Circle, CircleDot, CircleHelp } from "lucide-react";

import { Combobox } from "./Combobox";
import { RangeSlider } from "./RangeSlider";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CustomPropertyFiltersProps {
  properties: CustomProperty[];
  /** When provided, each property shows a tooltip naming the categories it belongs to. */
  categories?: Category[];
  /**
   * When provided, properties whose categories have no overlap with this set are dimmed,
   * collapsed, and moved to the bottom. Global properties (no categoryIds) are unaffected.
   */
  selectedCategoryIds?: string[];
  /** Bookmarks in view, used to derive slider bounds when a property has no min/max. */
  bookmarks: Pick<Bookmark, "numberValues">[];
  /** Active number-range filters keyed by property id (absent = no filter / full range). */
  numberValues: Record<string, [number, number]>;
  /** Active boolean filters keyed by property id (absent = no filter). */
  booleanValues: Record<string, boolean>;
  /** Active presence filters keyed by property id (absent = no filter). */
  presenceValues: Record<string, "has" | "missing">;
  /** Report a number filter (or `undefined` to clear it when back at full range). */
  onNumberFilterChange: (propertyId: string, range: [number, number] | undefined) => void;
  /** Report a boolean filter (`true`/`false`, or `undefined` to clear it). */
  onBooleanFilterChange: (propertyId: string, value: boolean | undefined) => void;
  /** Report a presence filter (`"has"`/`"missing"`, or `undefined` to clear it). */
  onPresenceFilterChange: (propertyId: string, mode: "has" | "missing" | undefined) => void;
}

/** Number and calculate properties share the range-slider control; both live in numberValues. */
function isRangeProperty(property: CustomProperty): boolean {
  return property.type === "number" || property.type === "calculate";
}

/** Resolve a property's slider bounds, falling back to the data range when a bound is null. */
function effectiveBounds(
  property: CustomProperty,
  bookmarks: Pick<Bookmark, "numberValues">[],
): [number, number] {
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
  w-0 min-w-0 overflow-hidden p-0 opacity-0
  transition-all duration-150
  group-hover/presence:w-7 group-hover/presence:opacity-100 group-hover/presence:p-1.5
`;

interface PresenceControlProps {
  propertyId: string;
  value: "has" | "missing" | undefined;
  onChange: (propertyId: string, mode: "has" | "missing" | undefined) => void;
}

function PresenceFilterControl({
  propertyId, value, onChange,
}: PresenceControlProps) {
  const toggleValue = value ?? "any";

  function handleChange(next: string) {
    if (next === "any" || next === "") {
      onChange(propertyId, undefined);
    }
    else {
      onChange(propertyId, next as "has" | "missing");
    }
  }

  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={toggleValue}
      onValueChange={handleChange}
      className="group/presence"
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
    </ToggleGroup>
  );
}

/** Renders one dynamic filter control per custom property in the filter sidebar. */
export function CustomPropertyFilters({
  properties,
  categories,
  selectedCategoryIds,
  bookmarks,
  numberValues,
  booleanValues,
  presenceValues,
  onNumberFilterChange,
  onBooleanFilterChange,
  onPresenceFilterChange,
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
    if (property.categoryIds.length === 0) return true;
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

  return (
    <div className="space-y-10">
      {sorted.map((property) => {
        const isActive = isPropertyActive(property);
        const presenceValue = presenceValues[property.id];
        const isFilterActive
          = numberValues[property.id] !== undefined
            || booleanValues[property.id] !== undefined
            || presenceValue !== undefined;

        function handleReset() {
          onNumberFilterChange(property.id, undefined);
          onBooleanFilterChange(property.id, undefined);
          onPresenceFilterChange(property.id, undefined);
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
                  className="
                    flex min-w-0 items-center gap-1.5 text-xs
                    text-muted-foreground
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
                />
              </div>
            </div>

            <CollapsibleContent
              className={cn("space-y-3", !isActive && "pointer-events-none")}
            >
              {presenceValue !== "missing" && isRangeProperty(property)
                ? (
                  <NumberFilterControl
                    property={property}
                    bounds={effectiveBounds(property, bookmarks)}
                    value={numberValues[property.id]}
                    onChange={onNumberFilterChange}
                  />
                )
                : null}

              {presenceValue !== "missing" && !isRangeProperty(property)
                ? (
                  <BooleanFilterControl
                    property={property}
                    value={booleanValues[property.id]}
                    onChange={onBooleanFilterChange}
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
      })}
    </div>
  );
}

interface NumberControlProps {
  property: CustomProperty;
  bounds: [number, number];
  /** Current filter range from the URL, or undefined when the filter is inactive. */
  value: [number, number] | undefined;
  onChange: (propertyId: string, range: [number, number] | undefined) => void;
}

function NumberFilterControl({
  property, bounds, value, onChange,
}: NumberControlProps) {
  const [min, max] = bounds;
  const range = value ?? [min, max];

  return (
    <RangeSlider
      min={min}
      max={max}
      value={range}
      onValueChange={(next) => {
        // Only an actually-narrowed range counts as an active filter.
        const active = next[0] > min || next[1] < max;
        onChange(property.id, active ? next : undefined);
      }}
    />
  );
}

interface BooleanControlProps {
  property: CustomProperty;
  /** Current filter value from the URL, or undefined when the filter is inactive. */
  value: boolean | undefined;
  onChange: (propertyId: string, value: boolean | undefined) => void;
}

const BOOLEAN_OPTIONS: ComboboxOption[] = [
  {
    value: "true",
    label: "Yes",
  },
  {
    value: "false",
    label: "No",
  },
];

function BooleanFilterControl({
  property, value, onChange,
}: BooleanControlProps) {
  const selected = value === undefined ? undefined : String(value);

  return (
    <Combobox
      options={BOOLEAN_OPTIONS}
      value={selected}
      placeholder={`Filter by ${property.name}…`}
      aria-label={`Filter by ${property.name}`}
      onValueChange={next =>
        onChange(property.id, next === undefined ? undefined : next === "true")}
    />
  );
}
