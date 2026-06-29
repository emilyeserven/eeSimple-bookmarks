import type { AutofillRule } from "@eesimple/types";

import { NO_CATEGORY } from "../lib/autofillScope";

/** Sentinel select value standing in for "no media type" (Radix selects can't hold an empty value). */
export const NO_MEDIA_TYPE = "none";

export interface AutofillRuleDefaultValues {
  name: string;
  description: string;
  setCategoryId: string;
  setMediaTypeId: string;
  tagIds: string[];
  locationIds: string[];
  sortOrder: number;
}

/** Preselected scope values for a new rule created from an entity's page. */
export interface AutofillRuleDefaults {
  defaultCategoryId?: string;
  defaultMediaTypeId?: string;
  defaultTagIds?: string[];
  defaultLocationIds?: string[];
}

/**
 * The typed form's default values: each falls back from the rule being edited to a scope preselection
 * to a sentinel/empty default. Extracted as a pure builder so the `??`/`?.` chain stays out of the
 * component (keeping it under the complexity cap) and is testable.
 */
export function buildAutofillRuleDefaultValues(
  rule: AutofillRule | undefined,
  defaults: AutofillRuleDefaults,
): AutofillRuleDefaultValues {
  return {
    name: rule?.name ?? "",
    description: rule?.description ?? "",
    setCategoryId: rule?.setCategoryId ?? defaults.defaultCategoryId ?? NO_CATEGORY,
    setMediaTypeId: rule?.setMediaTypeId ?? defaults.defaultMediaTypeId ?? NO_MEDIA_TYPE,
    tagIds: rule?.tagIds ?? defaults.defaultTagIds ?? [],
    locationIds: rule?.locationIds ?? defaults.defaultLocationIds ?? [],
    sortOrder: rule?.sortOrder ?? 0,
  };
}
