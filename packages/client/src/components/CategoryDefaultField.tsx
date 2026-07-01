import type { CustomProperty } from "@eesimple/types";

import { renderPropertyScalarInput } from "./PropertyScalarInput";

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
  const htmlId = `default-${category.id}-${property.id}`;
  const scalar = renderPropertyScalarInput({
    property,
    htmlId,
    numberInputs,
    dateTimeInputs,
    onNumberChange,
    onDateTimeChange,
  });
  if (scalar) return scalar;

  const current = booleanInputs[property.id];
  const selectValue = current === undefined ? "unset" : String(current);
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlId}>{property.name}</Label>
      <Select
        value={selectValue}
        onValueChange={value =>
          onBooleanChange(property.id, value === "unset" ? undefined : value === "true")}
      >
        <SelectTrigger id={htmlId}>
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
