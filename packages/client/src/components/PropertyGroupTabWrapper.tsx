import { createTabWrapper } from "./TabWrapper";

import { usePropertyGroupBySlug } from "@/hooks/usePropertyGroups";

/** Loads a property group by slug and renders a tab's title + description header above its content. */
export const PropertyGroupTabWrapper = createTabWrapper(
  "propertyGroupSlug",
  usePropertyGroupBySlug,
  result => result.propertyGroup,
  "Property group not found.",
);
