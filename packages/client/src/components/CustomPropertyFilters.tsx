import type { ComboboxOption } from "./Combobox";
import type { Bookmark, CustomProperty } from "@eesimple/types";

import { Combobox } from "./Combobox";
import { RangeSlider } from "./RangeSlider";

import { Label } from "@/components/ui/label";

interface CustomPropertyFiltersProps {
  properties: CustomProperty[];
  /** Bookmarks in view, used to derive slider bounds when a property has no min/max. */
  bookmarks: Pick<Bookmark, "numberValues">[];
  /** Active number-range filters keyed by property id (absent = no filter / full range). */
  numberValues: Record<string, [number, number]>;
  /** Active boolean filters keyed by property id (absent = no filter). */
  booleanValues: Record<string, boolean>;
  /** Report a number filter (or `undefined` to clear it when back at full range). */
  onNumberFilterChange: (propertyId: string, range: [number, number] | undefined) => void;
  /** Report a boolean filter (`true`/`false`, or `undefined` to clear it). */
  onBooleanFilterChange: (propertyId: string, value: boolean | undefined) => void;
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

/** Renders one dynamic filter control per custom property in the filter sidebar. */
export function CustomPropertyFilters({
  properties,
  bookmarks,
  numberValues,
  booleanValues,
  onNumberFilterChange,
  onBooleanFilterChange,
}: CustomPropertyFiltersProps) {
  if (properties.length === 0) return null;

  return (
    <div className="space-y-4">
      {properties.map(property => (
        <div
          key={property.id}
          className="space-y-1"
        >
          <Label className="text-xs text-muted-foreground">{property.name}</Label>
          {isRangeProperty(property)
            ? (
              <NumberFilterControl
                property={property}
                bounds={effectiveBounds(property, bookmarks)}
                value={numberValues[property.id]}
                onChange={onNumberFilterChange}
              />
            )
            : (
              <BooleanFilterControl
                property={property}
                value={booleanValues[property.id]}
                onChange={onBooleanFilterChange}
              />
            )}
        </div>
      ))}
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
      label={property.name}
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
