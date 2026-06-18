import { createTabWrapper } from "./TabWrapper";

import { usePropertyBySlug } from "@/hooks/useCustomProperties";

/**
 * Loads a custom property by slug and renders a tab's `title` + `description` header above its
 * content. Shared by the tabbed View and Edit pages so each tab stays a thin wrapper.
 */
export const PropertyTabWrapper = createTabWrapper(
  "propertySlug",
  usePropertyBySlug,
  result => result.property,
  "Custom property not found.",
);
