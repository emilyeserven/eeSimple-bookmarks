import type { CustomProperty } from "@eesimple/types";

import { DateTimePicker } from "./DateTimePicker";
import { StarRating } from "./StarRating";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RulePropertyFieldProps {
  property: CustomProperty;
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
  onNumberChange: (propertyId: string, value: string) => void;
  onBooleanChange: (propertyId: string, value: boolean) => void;
  onDateTimeChange: (propertyId: string, value: string) => void;
}

/** Renders a single prefill input for one custom property (number / datetime / boolean). */
export function RulePropertyField({
  property, numberInputs, booleanInputs, dateTimeInputs,
  onNumberChange, onBooleanChange, onDateTimeChange,
}: RulePropertyFieldProps) {
  if (property.type === "number") {
    return (
      <div className="space-y-1">
        <Label htmlFor={`rule-property-${property.id}`}>
          {property.name}
          {property.unitPlural ? ` (${property.unitPlural})` : ""}
        </Label>
        <Input
          id={`rule-property-${property.id}`}
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
        <Label htmlFor={`rule-property-${property.id}`}>{property.name}</Label>
        <DateTimePicker
          id={`rule-property-${property.id}`}
          format={property.dateTimeFormat ?? "date"}
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
  return (
    <div className="flex items-center gap-2 self-end">
      <Checkbox
        id={`rule-property-${property.id}`}
        checked={booleanInputs[property.id] ?? false}
        onCheckedChange={checked => onBooleanChange(property.id, checked === true)}
      />
      <Label htmlFor={`rule-property-${property.id}`}>{property.name}</Label>
    </div>
  );
}
