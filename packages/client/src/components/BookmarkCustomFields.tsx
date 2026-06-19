import type {
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  CustomProperty,
} from "@eesimple/types";

import { useEffect } from "react";

import { propertyAppliesToCategory, propertyAppliesToMediaType } from "@eesimple/types";

import { DATE_POSTED_SLUG, VIDEO_LENGTH_SLUG } from "./bookmarkFormSchema";
import { DateTimePicker } from "./DateTimePicker";
import { useCategoryDefaults } from "../hooks/useCategories";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CategoryCustomFieldsProps {
  categoryId: string;
  /** The bookmark's selected media type, if any; properties scoped to it also appear (union). */
  mediaTypeId?: string | null;
  properties: CustomProperty[];
  /** `default` shows properties flagged to appear in the main form; `advanced` shows the rest. */
  placement: "default" | "advanced";
  /** Extra classes for the root (e.g. a grid `col-span` when rendered in the main form). */
  className?: string;
  /**
   * Property slugs to drop from rendering entirely (their value is still submitted/derived).
   * Defaults to the form's server-filled slugs (e.g. Video Length).
   */
  hiddenSlugs?: string[];
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
  onNumberChange: (propertyId: string, value: string) => void;
  onBooleanChange: (propertyId: string, value: boolean) => void;
  onDateTimeChange: (propertyId: string, value: string) => void;
}

/** Renders the custom-property inputs for the properties assigned to the chosen category. */
export function CategoryCustomFields({
  categoryId, mediaTypeId = null, properties, placement, className,
  hiddenSlugs = [VIDEO_LENGTH_SLUG, DATE_POSTED_SLUG],
  numberInputs, booleanInputs, dateTimeInputs,
  onNumberChange, onBooleanChange, onDateTimeChange,
}: CategoryCustomFieldsProps) {
  const categoryProps = properties.filter((property) => {
    // Union scoping: a property shows if it applies to the bookmark's category OR its media type.
    if (
      !propertyAppliesToCategory(property, categoryId)
      && !propertyAppliesToMediaType(property, mediaTypeId)
    ) return false;
    if (!property.enabled) return false;
    // hiddenFromForm drops the field entirely; otherwise showInForm chooses the main area vs. Advanced.
    if (property.hiddenFromForm) return false;
    // Slugs the form fills server-side (e.g. Video Length) are hidden but still persisted.
    if (hiddenSlugs?.includes(property.slug)) return false;
    return placement === "default" ? property.showInForm : !property.showInForm;
  });
  if (categoryProps.length === 0) return null;

  return (
    <div
      className={`
        space-y-3
        ${className ?? ""}
      `}
    >
      <span className="text-sm font-medium">Properties</span>
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        {categoryProps.map((property) => {
          if (property.type === "number") {
            return (
              <div
                key={property.id}
                className="space-y-1"
              >
                <Label htmlFor={`property-${property.id}`}>
                  {property.name}
                  {property.unitPlural ? ` (${property.unitPlural})` : ""}
                </Label>
                <Input
                  id={`property-${property.id}`}
                  type="number"
                  value={numberInputs[property.id] ?? ""}
                  onChange={event => onNumberChange(property.id, event.target.value)}
                />
                {property.description
                  ? <p className="text-xs text-muted-foreground">{property.description}</p>
                  : null}
              </div>
            );
          }
          if (property.type === "boolean") {
            return (
              <div
                key={property.id}
                className="space-y-1 self-end"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`property-${property.id}`}
                    checked={booleanInputs[property.id] ?? false}
                    onCheckedChange={checked => onBooleanChange(property.id, checked === true)}
                  />
                  <Label htmlFor={`property-${property.id}`}>{property.name}</Label>
                </div>
                {property.description
                  ? <p className="text-xs text-muted-foreground">{property.description}</p>
                  : null}
              </div>
            );
          }
          if (property.type === "datetime") {
            return (
              <div
                key={property.id}
                className="space-y-1"
              >
                <Label htmlFor={`property-${property.id}`}>{property.name}</Label>
                <DateTimePicker
                  id={`property-${property.id}`}
                  format={property.dateTimeFormat ?? "date"}
                  value={dateTimeInputs[property.id] ?? null}
                  onChange={value => onDateTimeChange(property.id, value ?? "")}
                />
                {property.description
                  ? <p className="text-xs text-muted-foreground">{property.description}</p>
                  : null}
              </div>
            );
          }
          // calculate: computed server-side; shown read-only so the user knows it exists.
          return (
            <div
              key={property.id}
              className="space-y-1"
            >
              <Label>{property.name}</Label>
              <p className="text-xs text-muted-foreground">Calculated automatically when saved.</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CategoryDefaultsApplierProps {
  categoryId: string;
  onApply: (
    numberValues: BookmarkNumberValue[],
    booleanValues: BookmarkBooleanValue[],
    dateTimeValues: BookmarkDateTimeValue[],
  ) => void;
}

/**
 * Headless helper that loads the chosen category's default property values and applies them to the
 * form whenever the category changes. Renders nothing — the parent owns the property inputs.
 */
export function CategoryDefaultsApplier({
  categoryId, onApply,
}: CategoryDefaultsApplierProps) {
  const {
    data: defaults,
  } = useCategoryDefaults(categoryId);

  useEffect(() => {
    if (!categoryId || !defaults) return;
    onApply(defaults.numberValues, defaults.booleanValues, defaults.dateTimeValues);
    // Re-apply only when the category or its loaded defaults change; `onApply` is stable enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, defaults]);

  return null;
}
