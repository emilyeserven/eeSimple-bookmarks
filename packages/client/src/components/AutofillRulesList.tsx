import type { AutofillRule, ConditionNode } from "@eesimple/types";

import { useMemo, useState } from "react";

import { normalizeDomain } from "@eesimple/types";

import { NO_CATEGORY } from "./AutofillRuleForm";
import { AutofillRuleListItem } from "./AutofillRuleListItem";
import { ALL_CATEGORIES, AutofillRulesToolbar } from "./AutofillRulesToolbar";
import { useAutofillRules } from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { useWebsites } from "../hooks/useWebsites";
import { summarizeConditions } from "../lib/conditionsSummary";

interface AutofillRulesListProps {
  /**
   * When set, scopes the list to a single category: only rules that set this category are
   * shown and the category filter is hidden.
   */
  categoryId?: string;
  /**
   * When set, scopes the list to a single custom property: only rules that set a value for this
   * property (number / boolean / datetime) are shown and the category filter is hidden.
   */
  propertyId?: string;
  /**
   * When set, scopes the list to a single website: only rules whose conditions target this website
   * (via a Website condition) are shown and the category filter is hidden.
   */
  websiteId?: string;
}

/** True when the rule sets a value for `propertyId` via any of its custom-property value arrays. */
function ruleSetsProperty(rule: AutofillRule, propertyId: string): boolean {
  return rule.numberValues.some(value => value.propertyId === propertyId)
    || rule.booleanValues.some(value => value.propertyId === propertyId)
    || rule.dateTimeValues.some(value => value.propertyId === propertyId);
}

/** True when any Website condition in the rule's tree references `domain` (already normalized). */
function ruleTargetsWebsite(rule: AutofillRule, domain: string): boolean {
  const visit = (node: ConditionNode): boolean => {
    if (node.type === "website") return node.domains.some(d => normalizeDomain(d) === domain);
    if (node.type === "group") return node.children.some(visit);
    return false;
  };
  return visit(rule.conditions);
}

/** Read-only, searchable/filterable list of autofill rules; selecting one opens it in the panel. */
export function AutofillRulesList({
  categoryId,
  propertyId,
  websiteId,
}: AutofillRulesListProps = {}) {
  const {
    data: rules, isLoading, error,
  } = useAutofillRules();
  const {
    data: categories,
  } = useCategories();
  const {
    data: websites,
  } = useWebsites();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);

  // Whether the list is scoped to a single entity (category / property / website edit/view tab).
  const scoped = Boolean(categoryId) || Boolean(propertyId) || Boolean(websiteId);

  // The scoping website's normalized domain (rules reference websites by domain, not id).
  const websiteDomain = useMemo(() => {
    if (!websiteId) return undefined;
    const domain = (websites ?? []).find(site => site.id === websiteId)?.domain;
    return domain ? normalizeDomain(domain) : undefined;
  }, [websites, websiteId]);

  // Scope to the entity in context before any search/category filtering.
  const scopedRules = useMemo(() => {
    let list = rules ?? [];
    if (categoryId) list = list.filter(rule => rule.setCategoryId === categoryId);
    if (propertyId) list = list.filter(rule => ruleSetsProperty(rule, propertyId));
    if (websiteId) list = websiteDomain ? list.filter(rule => ruleTargetsWebsite(rule, websiteDomain)) : [];
    return list;
  }, [rules, categoryId, propertyId, websiteId, websiteDomain]);

  const visibleRules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return scopedRules.filter((rule) => {
      const matchesSearch = query === ""
        || rule.name.toLowerCase().includes(query)
        || summarizeConditions(rule.conditions).toLowerCase().includes(query);
      const matchesCategory = categoryFilter === ALL_CATEGORIES
        || (categoryFilter === NO_CATEGORY
          ? rule.setCategoryId === null
          : rule.setCategoryId === categoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [scopedRules, search, categoryFilter]);

  return (
    <section className="space-y-6">
      <AutofillRulesToolbar
        search={search}
        onSearchChange={setSearch}
        scoped={scoped}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        categories={categories ?? []}
      />

      {isLoading ? <p className="text-muted-foreground">Loading rules…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && scopedRules.length === 0
        ? (
          <p className="text-muted-foreground">
            {categoryId
              ? "No autofill rules add bookmarks to this category yet. Create one above."
              : propertyId
                ? "No autofill rules set this property yet. Create one above."
                : websiteId
                  ? "No autofill rules target this website yet. Create one above."
                  : "No autofill rules yet. Create one above."}
          </p>
        )
        : null}
      {!isLoading && scopedRules.length > 0 && visibleRules.length === 0
        ? <p className="text-muted-foreground">No rules match these filters.</p>
        : null}

      <div className="space-y-3">
        {visibleRules.map(rule => (
          <AutofillRuleListItem
            key={rule.id}
            rule={rule}
            categories={categories ?? []}
          />
        ))}
      </div>
    </section>
  );
}
