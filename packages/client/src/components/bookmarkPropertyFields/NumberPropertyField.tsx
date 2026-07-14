import type { CustomProperty } from "@eesimple/types";

import { FieldDescription } from "./FieldDescription";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NumberPropertyField({
  property, fieldId, value, onChange,
}: {
  property: CustomProperty;
  fieldId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={fieldId}>
        {property.name}
        {property.unitPlural ? ` (${property.unitPlural})` : ""}
      </Label>
      <Input
        id={fieldId}
        type="number"
        value={value}
        onChange={event => onChange(event.target.value)}
      />
      <FieldDescription text={property.description} />
    </div>
  );
}
