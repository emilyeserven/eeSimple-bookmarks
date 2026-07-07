import type { AutofillRulesFilters } from "./autofillRulesFacets";
import type { AutofillRule } from "@eesimple/types";

import { useMemo } from "react";

import { useNavigate } from "@tanstack/react-router";

import { filterAutofillRules } from "./autofillRulesFacets";
import { useTableRowNav } from "./tables/useTableRowNav";
import { useAutofillRulesTableConfig } from "./useAutofillRulesTableConfig";
import { useAutofillRules, useBulkDeleteAutofillRules } from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useWebsiteDomain } from "../hooks/useWebsiteDomain";
import { useListSelection } from "../lib/useListSelection";

export type { AutofillRulesFilters } from "./autofillRulesFacets";

/**
 * Owns the data + derivation for the autofill-rules listing: the rule/category queries, the facet +
 * text filtering, the view-mode/column hooks, and the selection/bulk-delete state. Returns one bag so
 * `AutofillRulesList` stays a presentational shell.
 */
export function useAutofillRulesList(filters: AutofillRulesFilters) {
  const {
    categoryId, propertyId, websiteId, tagId, mediaTypeId, locationId, channelId, noCategory, query,
  } = filters;
  const {
    data: rules, isLoading, error,
  } = useAutofillRules();
  const {
    data: categories,
  } = useCategories();

  const {
    columns, viewMode, ruleColumns,
  } = useAutofillRulesTableConfig(categories ?? []);
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  // The scoping website's normalized domain (rules reference websites by domain, not id).
  const websiteDomain = useWebsiteDomain(websiteId);

  const visibleRules = useMemo(
    () => filterAutofillRules(rules ?? [], {
      categoryId,
      propertyId,
      websiteId,
      tagId,
      mediaTypeId,
      locationId,
      channelId,
      noCategory,
    }, websiteDomain, query),
    [rules, categoryId, noCategory, propertyId, websiteId, websiteDomain, tagId, mediaTypeId, locationId, channelId, query],
  );

  const hasRules = (rules?.length ?? 0) > 0;
  const deletableIds = visibleRules.map(rule => rule.id);
  const selection = useListSelection("autofill-rules-listing", deletableIds);
  useRegisterBulkSelect("autofill-rules-listing");
  const bulkDelete = useBulkDeleteAutofillRules();

  function openRule(rule: AutofillRule, event: React.MouseEvent): void {
    rowNav(event, () => {
      void navigate({
        to: "/autofill/$ruleSlug",
        params: {
          ruleSlug: rule.slug,
        },
      });
    }, () => {
      void navigate({
        to: "/autofill/$ruleSlug/edit",
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
