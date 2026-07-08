import type { Bookmark, Category, CustomProperty } from "@eesimple/types";

import { Ban, ChevronDown, Circle, CircleDot, CircleHelp, CircleMinus } from "lucide-react";
import { useTranslation } from "react-i18next";

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

/**
 * The has/missing/exclude presence toggle for a single custom property. Exported (alongside
 * `PropertyFilterBody`) so a per-property pill can reuse it directly rather than duplicating the
 * `ToggleGroup` markup.
 */
export function PresenceFilterControl({
  propertyId, value, onChange, supportsExclude = false,
}: PresenceControlProps) {
  const {
    t,
  } = useTranslation();
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
            aria-label={t("Any")}
            className={cn(toggleValue !== "any" && collapseWhenInactive)}
          >
            <Circle className="size-3.5" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>{t("Any")}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem
            value="has"
            aria-label={t("Has value")}
            className={cn(toggleValue !== "has" && collapseWhenInactive)}
          >
            <CircleDot className="size-3.5" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>{t("Has value")}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem
            value="missing"
            aria-label={t("No value")}
            className={cn(toggleValue !== "missing" && collapseWhenInactive)}
          >
            <Ban className="size-3.5" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>{t("No value")}</TooltipContent>
      </Tooltip>
      {supportsExclude
        ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="exclude"
                aria-label={t("Excludes selected values")}
                className={cn(toggleValue !== "exclude" && collapseWhenInactive)}
              >
                <CircleMinus className="size-3.5" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>{t("Excludes selected values")}</TooltipContent>
          </Tooltip>
        )
        : null}
    </ToggleGroup>
  );
}

interface PropertyFilterBodyProps {
  property: CustomProperty;
  bookmarks: Pick<Bookmark, "numberValues">[];
  numberValue: [number, number] | undefined;
  booleanValue: boolean | undefined;
  dateTimeValue: [string | null, string | null] | undefined;
  presenceValue: "has" | "missing" | "exclude" | undefined;
  choicesValue: string[] | undefined;
  onNumberFilterChange: (propertyId: string, range: [number, number] | undefined) => void;
  onBooleanFilterChange: (propertyId: string, value: boolean | undefined) => void;
  onDateTimeFilterChange: (propertyId: string, range: [string | null, string | null] | undefined) => void;
  onChoicesFilterChange: (propertyId: string, values: string[]) => void;
  onPropertyReset: (propertyId: string) => void;
}

/**
 * One property's filter body: the type-specific control (number range / date-time / boolean /
 * choices, chosen by `property.type` and gated on `presenceValue`) plus a Reset button. Extracted
 * from the property's `Collapsible` so a future per-property popover can reuse it directly.
 */
export function PropertyFilterBody({
  property,
  bookmarks,
  numberValue,
  booleanValue,
  dateTimeValue,
  presenceValue,
  choicesValue,
  onNumberFilterChange,
  onBooleanFilterChange,
  onDateTimeFilterChange,
  onChoicesFilterChange,
  onPropertyReset,
}: PropertyFilterBodyProps) {
  const {
    t,
  } = useTranslation();
  const isFilterActive
    = numberValue !== undefined
      || booleanValue !== undefined
      || dateTimeValue !== undefined
      || presenceValue !== undefined
      || (choicesValue?.length ?? 0) > 0;

  return (
    <>
      {presenceValue !== "missing" && presenceValue !== "exclude" && isRangeProperty(property)
        ? (
          <NumberFilterControl
            property={property}
            bounds={effectiveBounds(property, bookmarks)}
            value={numberValue}
            onChange={onNumberFilterChange}
          />
        )
        : null}

      {presenceValue !== "missing" && presenceValue !== "exclude" && property.type === "datetime"
        ? (
          <DateTimeFilterControl
            property={property}
            value={dateTimeValue}
            onChange={onDateTimeFilterChange}
          />
        )
        : null}

      {presenceValue !== "missing" && presenceValue !== "exclude" && property.type === "boolean"
        ? (
          <BooleanFilterControl
            property={property}
            value={booleanValue}
            onChange={onBooleanFilterChange}
          />
        )
        : null}

      {presenceValue !== "missing" && property.type === "choices"
        ? (
          <ChoicesFilterControl
            property={property}
            value={choicesValue}
            onChange={onChoicesFilterChange}
          />
        )
        : null}

      {isFilterActive
        ? (
          <button
            type="button"
            onClick={() => onPropertyReset(property.id)}
            className="
              text-xs text-primary
              hover:underline
            "
          >
            {t("Reset")}
          </button>
        )
        : null}
    </>
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
  const {
    t,
  } = useTranslation();
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
                      aria-label={t("Associated categories")}
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
          <PropertyFilterBody
            property={property}
            bookmarks={bookmarks}
            numberValue={numberValues[property.id]}
            booleanValue={booleanValues[property.id]}
            dateTimeValue={dateTimeValues[property.id]}
            presenceValue={presenceValue}
            choicesValue={choicesValues[property.id]}
            onNumberFilterChange={onNumberFilterChange}
            onBooleanFilterChange={onBooleanFilterChange}
            onDateTimeFilterChange={onDateTimeFilterChange}
            onChoicesFilterChange={onChoicesFilterChange}
            onPropertyReset={onPropertyReset}
          />
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className="space-y-10">
      {visible.map(renderProperty)}
    </div>
  );
}
