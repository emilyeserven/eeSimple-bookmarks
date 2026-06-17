import type { ComboboxOption } from "./Combobox";
import type { Bookmark, CustomProperty } from "@eesimple/types";

import { useState } from "react";

import { Combobox } from "./Combobox";
import { RangeSlider } from "./RangeSlider";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface CustomPropertyFiltersProps {
  properties: CustomProperty[];
  /** Bookmarks in view, used to derive slider bounds when a property has no min/max. */
  bookmarks: Pick<Bookmark, "numberValues">[];
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

/** Renders one dynamic filter control per custom property under the bookmarks list. */
export function CustomPropertyFilters({
  properties, bookmarks, onNumberFilterChange, onBooleanFilterChange,
}: CustomPropertyFiltersProps) {
  if (properties.length === 0) return null;

  return (
    <Card>
      <CardContent
        className="
          grid gap-4
          sm:grid-cols-2
        "
      >
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
                  onChange={onNumberFilterChange}
                />
              )
              : (
                <BooleanFilterControl
                  property={property}
                  onChange={onBooleanFilterChange}
                />
              )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface NumberControlProps {
  property: CustomProperty;
  bounds: [number, number];
  onChange: (propertyId: string, range: [number, number] | undefined) => void;
}

function NumberFilterControl({
  property, bounds, onChange,
}: NumberControlProps) {
  const [min, max] = bounds;
  const [range, setRange] = useState<[number, number]>([min, max]);

  return (
    <RangeSlider
      min={min}
      max={max}
      value={range}
      label={property.name}
      onValueChange={(next) => {
        setRange(next);
        // Only an actually-narrowed range counts as an active filter.
        const active = next[0] > min || next[1] < max;
        onChange(property.id, active ? next : undefined);
      }}
    />
  );
}

interface BooleanControlProps {
  property: CustomProperty;
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
  property, onChange,
}: BooleanControlProps) {
  const [selected, setSelected] = useState<string | undefined>(undefined);

  return (
    <Combobox
      options={BOOLEAN_OPTIONS}
      value={selected}
      placeholder={`Filter by ${property.name}…`}
      aria-label={`Filter by ${property.name}`}
      onValueChange={(value) => {
        setSelected(value);
        onChange(property.id, value === undefined ? undefined : value === "true");
      }}
    />
  );
}
