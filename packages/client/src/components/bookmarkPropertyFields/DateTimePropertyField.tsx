import type { CustomProperty } from "@eesimple/types";

import { FieldDescription } from "./FieldDescription";
import { DateTimePicker } from "../DateTimePicker";

import { Label } from "@/components/ui/label";

export function DateTimePropertyField({
  property, fieldId, value, onChange,
}: {
  property: CustomProperty;
  fieldId: string;
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={fieldId}>{property.name}</Label>
      <DateTimePicker
        id={fieldId}
        format={property.dateTimeFormat ?? "date"}
        value={value}
        onChange={next => onChange(next ?? "")}
      />
      <FieldDescription text={property.description} />
    </div>
  );
}
