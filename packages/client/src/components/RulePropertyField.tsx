import type { CustomProperty } from "@eesimple/types";

import { renderPropertyScalarInput } from "./PropertyScalarInput";

import { Checkbox } from "@/components/ui/checkbox";
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
  const htmlId = `rule-property-${property.id}`;
  const scalar = renderPropertyScalarInput({
    property,
    htmlId,
    numberInputs,
    dateTimeInputs,
    onNumberChange,
    onDateTimeChange,
  });
  if (scalar) return scalar;

  return (
    <div className="flex items-center gap-2 self-end">
      <Checkbox
        id={htmlId}
        checked={booleanInputs[property.id] ?? false}
        onCheckedChange={checked => onBooleanChange(property.id, checked === true)}
      />
      <Label htmlFor={htmlId}>{property.name}</Label>
    </div>
  );
}
