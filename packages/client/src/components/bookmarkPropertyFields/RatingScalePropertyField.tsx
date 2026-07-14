import type { CustomProperty } from "@eesimple/types";

import { FieldDescription } from "./FieldDescription";
import { RatingRangeInput } from "../RatingRangeInput";
import { RatingValue } from "../RatingValue";

import { Label } from "@/components/ui/label";

export function RatingScalePropertyField({
  property, raw, onChange,
}: {
  property: CustomProperty;
  raw: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{property.name}</Label>
      <div>
        {property.ratingAllowRange
          ? (
            <RatingRangeInput
              property={property}
              raw={raw ?? ""}
              onChange={onChange}
            />
          )
          : (
            <RatingValue
              display={property.ratingDisplay ?? "stars"}
              value={raw ? Number(raw) : 0}
              max={property.ratingMax ?? 5}
              allowHalf={property.ratingAllowHalf}
              allowZero={property.ratingAllowZero}
              onChange={value => onChange(String(value))}
            />
          )}
      </div>
      <FieldDescription text={property.description} />
    </div>
  );
}
