import type { CustomPropertyType } from "@eesimple/types";

/** Human labels for each custom-property type, shared by the detail view and listing previews. */
export const TYPE_LABELS: Record<CustomPropertyType, string> = {
  number: "Number",
  boolean: "Boolean",
  calculate: "Calculate (Sum)",
};
