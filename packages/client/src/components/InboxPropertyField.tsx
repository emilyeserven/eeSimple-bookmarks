import type { CustomProperty, InboxPreFillDefaults } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";
import { MultiCombobox } from "./MultiCombobox";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** A single inbox-enabled custom property's pre-fill field, rendered inline. */
export function InboxPropertyField({
  property,
  preFill,
  setPreFill,
}: {
  property: CustomProperty;
  preFill: InboxPreFillDefaults;
  setPreFill: (update: InboxPreFillDefaults) => void;
}) {
  const {
    t,
  } = useTranslation();
  if (property.type === "boolean") {
    const current = preFill.booleanValues?.find(v => v.propertyId === property.id);
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={`inbox-prop-${property.id}`}
          checked={current?.value ?? false}
          onCheckedChange={(checked) => {
            const next = (preFill.booleanValues ?? []).filter(v => v.propertyId !== property.id);
            setPreFill({
              ...preFill,
              booleanValues: checked
                ? [...next, {
                  propertyId: property.id,
                  value: true,
                }]
                : next,
            });
          }}
        />
        <Label
          htmlFor={`inbox-prop-${property.id}`}
          className="text-sm"
        >
          {property.name}
        </Label>
      </div>
    );
  }

  if (property.type === "number" || property.type === "ratingScale") {
    const current = preFill.numberValues?.find(v => v.propertyId === property.id);
    return (
      <div className="space-y-1">
        <Label
          htmlFor={`inbox-prop-${property.id}`}
          className="text-sm"
        >
          {property.name}
        </Label>
        <Input
          id={`inbox-prop-${property.id}`}
          type="number"
          className="h-8 text-sm"
          placeholder="—"
          value={current?.value ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            const next = (preFill.numberValues ?? []).filter(v => v.propertyId !== property.id);
            setPreFill({
              ...preFill,
              numberValues: raw === ""
                ? next
                : [...next, {
                  propertyId: property.id,
                  value: Number(raw),
                }],
            });
          }}
        />
      </div>
    );
  }

  if (property.type === "datetime") {
    const current = preFill.dateTimeValues?.find(v => v.propertyId === property.id);
    return (
      <div className="space-y-1">
        <Label
          htmlFor={`inbox-prop-${property.id}`}
          className="text-sm"
        >
          {property.name}
        </Label>
        <Input
          id={`inbox-prop-${property.id}`}
          type="date"
          className="h-8 text-sm"
          value={current?.value ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            const next = (preFill.dateTimeValues ?? []).filter(v => v.propertyId !== property.id);
            setPreFill({
              ...preFill,
              dateTimeValues: val === ""
                ? next
                : [...next, {
                  propertyId: property.id,
                  value: val,
                }],
            });
          }}
        />
      </div>
    );
  }

  if (property.type === "choices") {
    const items = property.choicesItems ?? [];
    const options = items.map(item => ({
      value: item.value,
      label: item.label,
    }));
    const current = preFill.choicesValues?.find(v => v.propertyId === property.id);
    const currentValues = current?.values ?? [];

    if (property.choicesMultiple) {
      return (
        <div className="space-y-1">
          <Label className="text-sm">{property.name}</Label>
          <MultiCombobox
            options={options}
            values={currentValues}
            onValuesChange={(vals) => {
              const next = (preFill.choicesValues ?? []).filter(v => v.propertyId !== property.id);
              setPreFill({
                ...preFill,
                choicesValues: vals.length > 0
                  ? [...next, {
                    propertyId: property.id,
                    values: vals,
                  }]
                  : next,
              });
            }}
            placeholder={t("Select…")}
            aria-label={property.name}
          />
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <Label className="text-sm">{property.name}</Label>
        <Combobox
          options={options}
          value={currentValues[0]}
          onValueChange={(val) => {
            const next = (preFill.choicesValues ?? []).filter(v => v.propertyId !== property.id);
            setPreFill({
              ...preFill,
              choicesValues: val
                ? [...next, {
                  propertyId: property.id,
                  values: [val],
                }]
                : next,
            });
          }}
          placeholder="Select…"
          aria-label={property.name}
        />
      </div>
    );
  }

  return null;
}
