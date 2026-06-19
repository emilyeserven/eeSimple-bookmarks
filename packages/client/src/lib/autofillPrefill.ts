import type { ConditionTree, CreateAutofillRuleInput } from "@eesimple/types";

import { emptyConditionTree } from "@eesimple/types";

/**
 * Scope defaults derived from the entity page a new autofill rule is created from (e.g. a category's
 * or website's autofill tab). Every field is optional — on an unscoped surface they're all undefined.
 */
export interface AutofillScopeDefaults {
  /** Preselected target category (becomes both a "when" condition and the rule's "set" category). */
  categoryId?: string;
  /** Preselected target media type (becomes both a "when" condition and the rule's "set" media type). */
  mediaTypeId?: string;
  /** Preselected website domain (becomes a "when" condition). */
  websiteDomain?: string;
  /** Preselected tag ids (become the rule's "set" tags). */
  tagIds?: string[];
  /** Preselected YouTube channel ids (become a "when" condition). */
  channelIds?: string[];
  /** Preselected custom property — only opens the property section; no concrete value to prefill. */
  propertyId?: string;
}

/** Initial "when" tree for a new rule: empty, or pre-scoped to a website/channel/category/media-type when created from one. */
export function seedConditions(defaults: AutofillScopeDefaults): ConditionTree {
  const tree = emptyConditionTree();
  const leaves: ConditionTree["children"] = [];
  if (defaults.websiteDomain) {
    leaves.push({
      type: "website",
      domains: [defaults.websiteDomain],
    });
  }
  if (defaults.channelIds && defaults.channelIds.length > 0) {
    leaves.push({
      type: "youtube-channel",
      channelIds: defaults.channelIds,
    });
  }
  if (defaults.categoryId) {
    leaves.push({
      type: "category",
      categoryIds: [defaults.categoryId],
    });
  }
  if (defaults.mediaTypeId) {
    leaves.push({
      type: "media-type",
      mediaTypeIds: [defaults.mediaTypeId],
    });
  }
  if (leaves.length === 0) return tree;
  return {
    ...tree,
    children: leaves,
  };
}

/**
 * Builds the create payload (minus the name) for a new autofill rule from its scope defaults. Mirrors
 * what the drawer's `AutofillRuleForm` produces, so a rule created via the name-only modal lands in
 * the same scoped lists and arrives pre-populated on its edit page.
 */
export function buildAutofillRulePrefill(defaults: AutofillScopeDefaults): Omit<CreateAutofillRuleInput, "name"> {
  return {
    conditions: seedConditions(defaults),
    setCategoryId: defaults.categoryId ?? null,
    setMediaTypeId: defaults.mediaTypeId ?? null,
    tagIds: defaults.tagIds ?? [],
  };
}
