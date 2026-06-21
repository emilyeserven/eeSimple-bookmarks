import type { CustomProperty } from "@eesimple/types";

import { STANDARD_CARD_FIELDS } from "../lib/bookmarkCardFields";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CardDisplayControlsBaseProps {
  /** Field keys currently hidden (standard field key or custom-property id). */
  hidden: string[];
  /** Toggle a field key on/off. */
  onToggle: (fieldKey: string) => void;
  /** Custom properties the surface can show, used to extend the standard field list. */
  properties: CustomProperty[];
  /** Stable id prefix so checkbox/label pairs stay unique when multiple instances share a page. */
  idPrefix?: string;
}

/**
 * Controlled toggles for which fields appear on bookmark cards: the standard fields plus each custom
 * property the surface can show. Presentational — callers supply `hidden`/`onToggle`/`properties`.
 * Reused by the uiStore-backed `CardDisplayControls` (listings) and the homepage section form.
 */
export function CardDisplayControlsBase({
  hidden, onToggle, properties, idPrefix = "card-field",
}: CardDisplayControlsBaseProps) {
  const customFields = properties
    .filter(property =>
      property.showInListings
      && property.type !== "calculate"
      && (property.allCategories || property.categoryIds.length > 0))
    .map(property => ({
      key: property.id,
      label: property.name,
    }));

  const fields = [...STANDARD_CARD_FIELDS, ...customFields];

  return (
    <div className="flex flex-col gap-2">
      {fields.map(field => (
        <div
          key={field.key}
          className="flex items-center gap-2"
        >
          <Checkbox
            id={`${idPrefix}-${field.key}`}
            checked={!hidden.includes(field.key)}
            onCheckedChange={() => onToggle(field.key)}
          />
          <Label htmlFor={`${idPrefix}-${field.key}`}>{field.label}</Label>
        </div>
      ))}
    </div>
  );
}
