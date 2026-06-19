import { STANDARD_CARD_FIELDS } from "../lib/bookmarkCardFields";
import { useUiStore } from "../stores/uiStore";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CardDisplayControlsProps {
  pageKey: string;
}

/**
 * Per-listing toggles for which fields appear on bookmark cards: the standard fields plus each
 * custom property the page can show. Filters card display on top of each property's global
 * `showInListings` flag without changing it.
 */
export function CardDisplayControls({
  pageKey,
}: CardDisplayControlsProps) {
  const hidden = useUiStore(state => state.hiddenCardFields[pageKey]) ?? [];
  const toggleCardField = useUiStore(state => state.toggleCardField);
  const properties = useUiStore(state => state.filterContext?.properties) ?? [];

  const customFields = properties
    .filter(property => property.showInListings && property.type !== "calculate")
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
            id={`card-field-${field.key}`}
            checked={!hidden.includes(field.key)}
            onCheckedChange={() => toggleCardField(pageKey, field.key)}
          />
          <Label htmlFor={`card-field-${field.key}`}>{field.label}</Label>
        </div>
      ))}
    </div>
  );
}
