import type { CustomProperty } from "@eesimple/types";
import type { ReactElement } from "react";

import { DateTimePicker } from "./DateTimePicker";
import { StarRating } from "./StarRating";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PropertyScalarInputProps {
  property: CustomProperty;
  /** The `id`/`htmlFor` to use for the rendered control (unique per surface). */
  htmlId: string;
  numberInputs: Record<string, string>;
  dateTimeInputs: Record<string, string>;
  onNumberChange: (propertyId: string, value: string) => void;
  onDateTimeChange: (propertyId: string, value: string) => void;
}

/**
 * Renders the number / datetime / ratingScale editor control shared by `CategoryDefaultField` and
 * `RulePropertyField`. Returns `null` for any other property type so the caller can render its own
 * (differing) fallback control — a tri-state select for category defaults, a checkbox for rule
 * prefills. Written as a function (not a component) so callers can dispatch with `?? <fallback>`.
 */
export function renderPropertyScalarInput({
  property, htmlId, numberInputs, dateTimeInputs, onNumberChange, onDateTimeChange,
}: PropertyScalarInputProps): ReactElement | null {
  if (property.type === "number") {
    return (
      <div className="space-y-1">
        <Label htmlFor={htmlId}>
          {property.name}
          {property.unitPlural ? ` (${property.unitPlural})` : ""}
        </Label>
        <Input
          id={htmlId}
          type="number"
          value={numberInputs[property.id] ?? ""}
          onChange={event => onNumberChange(property.id, event.target.value)}
        />
      </div>
    );
  }
  if (property.type === "datetime") {
    return (
      <div className="space-y-1">
        <Label htmlFor={htmlId}>{property.name}</Label>
        <DateTimePicker
          id={htmlId}
          format={property.dateTimeFormat ?? "date"}
          allowYearMonth={property.dateTimeAllowYearMonth}
          value={dateTimeInputs[property.id] ?? null}
          onChange={value => onDateTimeChange(property.id, value ?? "")}
        />
      </div>
    );
  }
  if (property.type === "ratingScale") {
    const raw = numberInputs[property.id];
    return (
      <div className="space-y-1">
        <Label>{property.name}</Label>
        <div>
          <StarRating
            value={raw ? Number(raw) : 0}
            max={property.ratingMax ?? 5}
            allowHalf={property.ratingAllowHalf}
            allowZero={property.ratingAllowZero}
            onChange={value => onNumberChange(property.id, String(value))}
          />
        </div>
      </div>
    );
  }
  return null;
}
