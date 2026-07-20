import type { CustomProperty } from "@eesimple/types";

import { FieldDescription } from "./FieldDescription";
import { RatingRangeInput } from "../RatingRangeInput";
import { RatingValue } from "../RatingValue";

import { Label } from "@/components/ui/label";

export function RatingScalePropertyField({
  property, raw, onChange, categoryId,
}: {
  property: CustomProperty;
  raw: string | undefined;
  onChange: (value: string) => void;
  /** The owning bookmark's category, so the property's per-category level labels apply. */
  categoryId?: string | null;
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
              categoryId={categoryId}
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
