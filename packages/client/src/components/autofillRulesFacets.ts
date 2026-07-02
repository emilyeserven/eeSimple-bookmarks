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

/**
 * Does one rule pass the active facet filters (AND)? The pure per-rule predicate behind
 * `applyFacets` — also handed to `ListingScaffold` as the unscoped listing's `externalFilter`.
 * The free-text `query` is deliberately not part of this: text search is the header search's job.
 * `websiteId` with no resolved `websiteDomain` matches nothing (rules reference websites by domain).
 */
export function ruleMatchesFacets(
  rule: AutofillRule,
  filters: Omit<AutofillRulesFilters, "query">,
  websiteDomain: string | undefined,
): boolean {
  const {
    categoryId, propertyId, websiteId, tagId, mediaTypeId, locationId, channelId, noCategory,
  } = filters;
  if (categoryId && rule.setCategoryId !== categoryId) return false;
  if (noCategory && rule.setCategoryId !== null) return false;
  if (propertyId && !ruleSetsProperty(rule, propertyId)) return false;
  if (websiteId && (!websiteDomain || !ruleTargetsWebsite(rule, websiteDomain))) return false;
  if (tagId && !ruleSetsTag(rule, tagId)) return false;
  if (mediaTypeId && !ruleSetsMediaType(rule, mediaTypeId)) return false;
  if (locationId && !ruleSetsLocation(rule, locationId)) return false;
  if (channelId && !ruleTargetsYoutubeChannel(rule, channelId)) return false;
  return true;
}

/** Apply the active facet filters (AND) to the rules, before the text search. */
export function applyFacets(
  rules: AutofillRule[],
  filters: Omit<AutofillRulesFilters, "query">,
  websiteDomain: string | undefined,
): AutofillRule[] {
  return rules.filter(rule => ruleMatchesFacets(rule, filters, websiteDomain));
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
