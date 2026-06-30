import type { ComboboxOption } from "./Combobox";
import type { CustomProperty } from "@eesimple/types";

import { Combobox } from "./Combobox";
import { DateTimeRangeFields } from "./DateTimePicker";
import { MultiCombobox } from "./MultiCombobox";
import { RangeSlider } from "./RangeSlider";

import { formatBoolean } from "@/lib/bookmarkFormat";

/** Slider step for a property; rating scales step by half when half ratings are allowed. */
function rangeStep(property: CustomProperty): number {
  return property.type === "ratingScale" && property.ratingAllowHalf ? 0.5 : 1;
}

interface NumberControlProps {
  property: CustomProperty;
  bounds: [number, number];
  /** Current filter range from the URL, or undefined when the filter is inactive. */
  value: [number, number] | undefined;
  onChange: (propertyId: string, range: [number, number] | undefined) => void;
}

export function NumberFilterControl({
  property, bounds, value, onChange,
}: NumberControlProps) {
  const [min, max] = bounds;
  const range = value ?? [min, max];

  return (
    <RangeSlider
      min={min}
      max={max}
      step={rangeStep(property)}
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

export function BooleanFilterControl({
  property, value, onChange,
}: BooleanControlProps) {
  const selected = value === undefined ? undefined : String(value);
  const booleanOptions: ComboboxOption[] = [
    {
      value: "true",
      label: formatBoolean(true, property),
    },
    {
      value: "false",
      label: formatBoolean(false, property),
    },
  ];

  return (
    <Combobox
      options={booleanOptions}
      value={selected}
      placeholder={`Filter by ${property.name}…`}
      aria-label={`Filter by ${property.name}`}
      onValueChange={next =>
        onChange(property.id, next === undefined ? undefined : next === "true")}
    />
  );
}

interface ChoicesControlProps {
  property: CustomProperty;
  /** Current selected choice slugs from the URL, or undefined when the filter is inactive. */
  value: string[] | undefined;
  onChange: (propertyId: string, values: string[]) => void;
}

export function ChoicesFilterControl({
  property, value, onChange,
}: ChoicesControlProps) {
  const options = (property.choicesItems ?? []).map(item => ({
    value: item.value,
    label: item.label,
  }));
  return (
    <MultiCombobox
      options={options}
      values={value ?? []}
      onValuesChange={values => onChange(property.id, values)}
      placeholder={`Filter by ${property.name}…`}
      aria-label={`Filter by ${property.name}`}
    />
  );
}

interface DateTimeControlProps {
  property: CustomProperty;
  /** Current `[from, to]` range from the URL, or undefined when the filter is inactive. */
  value: [string | null, string | null] | undefined;
  onChange: (propertyId: string, range: [string | null, string | null] | undefined) => void;
}

/** A From/To date-time range filter for a `datetime` property, built on the shared picker. */
export function DateTimeFilterControl({
  property, value, onChange,
}: DateTimeControlProps) {
  const [from, to] = value ?? [null, null];

  return (
    <DateTimeRangeFields
      format={property.dateTimeFormat ?? "date"}
      from={from}
      to={to}
      onChange={next => onChange(property.id, [next.from, next.to])}
    />
  );
}
