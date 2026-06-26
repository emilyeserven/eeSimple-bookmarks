import type { AutofillRule } from "@eesimple/types";

import { useMemo } from "react";

import { useNavigate } from "@tanstack/react-router";

import { useAutofillRuleColumns } from "./tables/autofillRuleColumns";
import { useTableRowNav } from "./tables/useTableRowNav";
import { useAutofillRules, useBulkDeleteAutofillRules } from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useWebsiteDomain } from "../hooks/useWebsiteDomain";
import { ruleSetsMediaType, ruleSetsProperty, ruleSetsTag, ruleTargetsWebsite, ruleTargetsYoutubeChannel } from "../lib/autofillRulesFilter";
import { useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { summarizeConditions } from "../lib/conditionsSummary";
import { useListSelection } from "../lib/useListSelection";

/** The active facet filters for an autofill-rules list; each narrows the set (combined with AND). */
export interface AutofillRulesFilters {
  categoryId?: string;
  propertyId?: string;
  websiteId?: string;
  tagId?: string;
  mediaTypeId?: string;
  channelId?: string;
  noCategory?: boolean;
  query: string;
}

/** Apply the active facet filters (AND) to the rules, before the text search. */
function applyFacets(
  rules: AutofillRule[],
  filters: Omit<AutofillRulesFilters, "query">,
  websiteDomain: string | undefined,
): AutofillRule[] {
  const {
    categoryId, propertyId, websiteId, tagId, mediaTypeId, channelId, noCategory,
  } = filters;
  let list = rules;
  if (categoryId) list = list.filter(rule => rule.setCategoryId === categoryId);
  if (noCategory) list = list.filter(rule => rule.setCategoryId === null);
  if (propertyId) list = list.filter(rule => ruleSetsProperty(rule, propertyId));
  if (websiteId) list = websiteDomain ? list.filter(rule => ruleTargetsWebsite(rule, websiteDomain)) : [];
  if (tagId) list = list.filter(rule => ruleSetsTag(rule, tagId));
  if (mediaTypeId) list = list.filter(rule => ruleSetsMediaType(rule, mediaTypeId));
  if (channelId) list = list.filter(rule => ruleTargetsYoutubeChannel(rule, channelId));
  return list;
}

/**
 * Owns the data + derivation for the autofill-rules listing: the rule/category queries, the facet +
 * text filtering, the view-mode/column hooks, and the selection/bulk-delete state. Returns one bag so
 * `AutofillRulesList` stays a presentational shell.
 */
export function useAutofillRulesList(filters: AutofillRulesFilters) {
  const {
    categoryId, propertyId, websiteId, tagId, mediaTypeId, channelId, noCategory, query,
  } = filters;
  const {
    data: rules, isLoading, error,
  } = useAutofillRules();
  const {
    data: categories,
  } = useCategories();

  const columns = useBookmarkColumns("autofill-rules-listing");
  const viewMode = useViewMode("autofill-rules-listing");
  const ruleColumns = useAutofillRuleColumns(categories ?? []);
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  // The scoping website's normalized domain (rules reference websites by domain, not id).
  const websiteDomain = useWebsiteDomain(websiteId);

  const filteredRules = useMemo(
    () => applyFacets(rules ?? [], {
      categoryId,
      propertyId,
      websiteId,
      tagId,
      mediaTypeId,
      channelId,
      noCategory,
    }, websiteDomain),
    [rules, categoryId, noCategory, propertyId, websiteId, websiteDomain, tagId, mediaTypeId, channelId],
  );

  const visibleRules = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized === "") return filteredRules;
    return filteredRules.filter(rule =>
      rule.name.toLowerCase().includes(normalized)
      || summarizeConditions(rule.conditions).toLowerCase().includes(normalized));
  }, [filteredRules, query]);

  const hasRules = (rules?.length ?? 0) > 0;
  const deletableIds = visibleRules.map(rule => rule.id);
  const selection = useListSelection("autofill-rules-listing", deletableIds);
  useRegisterBulkSelect("autofill-rules-listing");
  const bulkDelete = useBulkDeleteAutofillRules();

  function openRule(rule: AutofillRule, event: React.MouseEvent): void {
    rowNav(event, "autofill", rule.id, () => {
      void navigate({
        to: "/autofill/$ruleSlug",
        params: {
          ruleSlug: rule.slug,
        },
      });
    }, () => {
      void navigate({
        to: "/autofill/$ruleSlug/edit/general",
        params: {
          ruleSlug: rule.slug,
        },
      });
    });
  }

  return {
    isLoading,
    error,
    columns,
    viewMode,
    ruleColumns,
    categories: categories ?? [],
    visibleRules,
    hasRules,
    deletableIds,
    selection,
    bulkDelete,
    openRule,
  };
}
