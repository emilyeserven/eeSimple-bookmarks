import type { CustomProperty } from "@eesimple/types";

import { FieldDescription } from "./FieldDescription";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function BooleanPropertyField({
  property, fieldId, checked, onChange,
}: {
  property: CustomProperty;
  fieldId: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="space-y-1 self-end">
      <div className="flex items-center gap-2">
        <Checkbox
          id={fieldId}
          checked={checked}
          onCheckedChange={value => onChange(value === true)}
        />
        <Label htmlFor={fieldId}>{property.name}</Label>
      </div>
      <FieldDescription text={property.description} />
    </div>
  );
}
