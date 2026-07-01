import type { CustomProperty } from "@eesimple/types";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/**
 * A multi-select checkbox list for a choices custom property. Shared by the `checkbox` display and
 * the multi-select `dropdown` display of `ChoicesPropertyField`, which render identically.
 */
export function ChoicesCheckboxList({
  property, fieldId, selectedValues, onChange,
}: {
  property: CustomProperty;
  fieldId: string;
  selectedValues: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="col-span-full space-y-1">
      <Label>{property.name}</Label>
      <div className="space-y-1.5">
        {property.choicesItems.map(item => (
          <div
            key={item.value}
            className="flex items-center gap-2"
          >
            <Checkbox
              id={`${fieldId}-${item.value}`}
              checked={selectedValues.includes(item.value)}
              onCheckedChange={(checked) => {
                onChange(
                  checked
                    ? [...selectedValues, item.value]
                    : selectedValues.filter(v => v !== item.value),
                );
              }}
            />
            <Label
              htmlFor={`${fieldId}-${item.value}`}
              className="font-normal"
            >{item.label}
            </Label>
          </div>
        ))}
      </div>
      {property.description
        ? <p className="text-xs text-muted-foreground">{property.description}</p>
        : null}
    </div>
  );
}
