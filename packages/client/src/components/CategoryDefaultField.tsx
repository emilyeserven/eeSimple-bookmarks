import type { CustomProperty } from "@eesimple/types";

import { DateTimePicker } from "./DateTimePicker";
import { StarRating } from "./StarRating";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryDefaultFieldProps {
  category: { id: string };
  property: CustomProperty;
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean | undefined>;
  dateTimeInputs: Record<string, string>;
  onNumberChange: (propertyId: string, value: string) => void;
  onBooleanChange: (propertyId: string, value: boolean | undefined) => void;
  onDateTimeChange: (propertyId: string, value: string) => void;
}

/**
 * Editor control for one category default value, dispatched by the property's type:
 * a number input, date-time picker, star rating, or Yes/No/No-default select.
 */
export function CategoryDefaultField({
  category,
  property,
  numberInputs,
  booleanInputs,
  dateTimeInputs,
  onNumberChange,
  onBooleanChange,
  onDateTimeChange,
}: CategoryDefaultFieldProps) {
  if (property.type === "number") {
    return (
      <div className="space-y-1">
        <Label htmlFor={`default-${category.id}-${property.id}`}>
          {property.name}
          {property.unitPlural ? ` (${property.unitPlural})` : ""}
        </Label>
        <Input
          id={`default-${category.id}-${property.id}`}
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
        <Label htmlFor={`default-${category.id}-${property.id}`}>{property.name}</Label>
        <DateTimePicker
          id={`default-${category.id}-${property.id}`}
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
  const current = booleanInputs[property.id];
  const selectValue = current === undefined ? "unset" : String(current);
  return (
    <div className="space-y-1">
      <Label htmlFor={`default-${category.id}-${property.id}`}>{property.name}</Label>
      <Select
        value={selectValue}
        onValueChange={value =>
          onBooleanChange(property.id, value === "unset" ? undefined : value === "true")}
      >
        <SelectTrigger id={`default-${category.id}-${property.id}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unset">No default</SelectItem>
          <SelectItem value="true">Yes</SelectItem>
          <SelectItem value="false">No</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
