import type { AutofillRule } from "@eesimple/types";

import { ruleSetsLocation, ruleSetsMediaType, ruleSetsProperty, ruleSetsTag, ruleTargetsWebsite, ruleTargetsYoutubeChannel } from "../lib/autofillRulesFilter";
import { summarizeConditions } from "../lib/conditionsSummary";

/** The active facet filters for an autofill-rules list; each narrows the set (combined with AND). */
export interface AutofillRulesFilters {
  categoryId?: string;
  propertyId?: string;
  websiteId?: string;
  tagId?: string;
  mediaTypeId?: string;
  locationId?: string;
  channelId?: string;
  noCategory?: boolean;
  query: string;
}

/** Apply the active facet filters (AND) to the rules, before the text search. */
export function applyFacets(
  rules: AutofillRule[],
  filters: Omit<AutofillRulesFilters, "query">,
  websiteDomain: string | undefined,
): AutofillRule[] {
  const {
    categoryId, propertyId, websiteId, tagId, mediaTypeId, locationId, channelId, noCategory,
  } = filters;
  let list = rules;
  if (categoryId) list = list.filter(rule => rule.setCategoryId === categoryId);
  if (noCategory) list = list.filter(rule => rule.setCategoryId === null);
  if (propertyId) list = list.filter(rule => ruleSetsProperty(rule, propertyId));
  if (websiteId) list = websiteDomain ? list.filter(rule => ruleTargetsWebsite(rule, websiteDomain)) : [];
  if (tagId) list = list.filter(rule => ruleSetsTag(rule, tagId));
  if (mediaTypeId) list = list.filter(rule => ruleSetsMediaType(rule, mediaTypeId));
  if (locationId) list = list.filter(rule => ruleSetsLocation(rule, locationId));
  if (channelId) list = list.filter(rule => ruleTargetsYoutubeChannel(rule, channelId));
  return list;
}

/** Narrow the rules by the active facets, then by the free-text query (name + condition summary). */
export function filterAutofillRules(
  rules: AutofillRule[],
  filters: Omit<AutofillRulesFilters, "query">,
  websiteDomain: string | undefined,
  query: string,
): AutofillRule[] {
  const filtered = applyFacets(rules, filters, websiteDomain);
  const normalized = query.trim().toLowerCase();
  if (normalized === "") return filtered;
  return filtered.filter(rule =>
    rule.name.toLowerCase().includes(normalized)
    || summarizeConditions(rule.conditions).toLowerCase().includes(normalized));
}
