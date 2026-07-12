import type { ComboboxOption } from "../../Combobox";
import type { ExtensionFillOverrides, OverrideKey } from "@eesimple/types";

import { SOCIAL_MEDIA_PLATFORMS } from "@eesimple/types";

/**
 * Pure metadata for the fill-rule-group override editors (kept out of the `.tsx` so it can export
 * non-component values — the editors file exposes only the {@link OverrideValueEditor} component).
 */

/** Human labels for each overridable option, shown in the group's override list + "Add override" menu. */
export const OVERRIDE_KEY_LABELS: Record<OverrideKey, string> = {
  "pathMatch": "Path match",
  "target.kind": "Target kind",
  "field.field": "Bookmark field",
  "customProperty.propertyId": "Custom property",
  "customProperty.subField": "Property sub-value",
  "customProperty.choiceValue": "Property choice",
  "taxonomy.taxonomy": "Taxonomy",
  "image.setMain": "Set as main image",
  "taxonomyEntity.association": "Linked taxonomy",
  "taxonomyEntity.field": "Linked term field",
  "taxonomyEntity.socialPlatform": "Linked social platform",
  "taxonomyDirect.association": "Page entity taxonomy",
  "taxonomyDirect.resolve": "Page entity resolution",
  "taxonomyDirect.field": "Page entity field",
  "taxonomyDirect.socialPlatform": "Page entity social platform",
  "sections.propertyId": "Sections property",
  "sections.entryType": "Sections entry type",
  "sections.layout": "Sections layout",
};

/** The blank value used when a group first adds an override for a key. */
export function defaultOverrideValue(key: OverrideKey): ExtensionFillOverrides[OverrideKey] {
  switch (key) {
    case "pathMatch":
      return {
        mode: "prefix",
        value: "",
      };
    case "target.kind":
      return "field";
    case "field.field":
      return "title";
    case "customProperty.propertyId":
    case "customProperty.choiceValue":
    case "sections.propertyId":
      return "";
    case "customProperty.subField":
      return "current";
    case "taxonomy.taxonomy":
      return "people";
    case "image.setMain":
      return true;
    case "taxonomyEntity.association":
    case "taxonomyDirect.association":
      return "website";
    case "taxonomyEntity.field":
    case "taxonomyDirect.field":
      return "name";
    case "taxonomyEntity.socialPlatform":
    case "taxonomyDirect.socialPlatform":
      return SOCIAL_MEDIA_PLATFORMS[0];
    case "taxonomyDirect.resolve":
      return {
        mode: "url",
      };
    case "sections.entryType":
      return "name";
    case "sections.layout":
      return {};
  }
}

/** Props each per-key value editor receives (value is the key's own value type; cast inside). */
export interface OverrideEditorProps {
  value: unknown;
  onChange: (value: unknown) => void;
  /** The group's other overrides (so an association-dependent field editor can read its sibling). */
  overrides: ExtensionFillOverrides;
  propertyOptions: ComboboxOption[];
  sectionsOptions: ComboboxOption[];
}
