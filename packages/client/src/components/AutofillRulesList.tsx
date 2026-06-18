import type {
  AutofillRule,
  Category,
} from "@eesimple/types";

import { useMemo, useState } from "react";

import { Link } from "@tanstack/react-router";

import { NO_CATEGORY } from "./AutofillRuleForm";
import { useViewPanelClick } from "./panel/useEditPanelClick";
import { usePanelControls } from "./panel/usePanelControls";
import { useAutofillRules } from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { summarizeConditions } from "../lib/conditionsSummary";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NEW_SENTINEL } from "@/lib/drawerSearch";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** Select sentinel for "show rules for every category". */
const ALL_CATEGORIES = "all";

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
}

/** True when the rule sets a value for `propertyId` via any of its custom-property value arrays. */
function ruleSetsProperty(rule: AutofillRule, propertyId: string): boolean {
  return rule.numberValues.some(value => value.propertyId === propertyId)
    || rule.booleanValues.some(value => value.propertyId === propertyId)
    || rule.dateTimeValues.some(value => value.propertyId === propertyId);
}

/** Read-only, searchable/filterable list of autofill rules; selecting one opens it in the panel. */
export function AutofillRulesList({
  categoryId,
  propertyId,
}: AutofillRulesListProps = {}) {
  const {
    data: rules, isLoading, error,
  } = useAutofillRules();
  const {
    data: categories,
  } = useCategories();
  const {
    openAutofill,
  } = usePanelControls();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);

  // Whether the list is scoped to a single entity (category or property edit/view tab).
  const scoped = Boolean(categoryId) || Boolean(propertyId);

  // Scope to the entity in context before any search/category filtering.
  const scopedRules = useMemo(() => {
    let list = rules ?? [];
    if (categoryId) list = list.filter(rule => rule.setCategoryId === categoryId);
    if (propertyId) list = list.filter(rule => ruleSetsProperty(rule, propertyId));
    return list;
  }, [rules, categoryId, propertyId]);

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
      <div
        className="
          flex flex-col gap-3
          sm:flex-row sm:items-center sm:justify-between
        "
      >
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <Input
            type="search"
            placeholder="Search rules…"
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="max-w-xs"
          />
          {scoped
            ? null
            : (
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger
                  aria-label="Filter by category"
                  className="w-56"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                  <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                  {(categories ?? []).map(category => (
                    <SelectItem
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
        </div>

        <Button
          type="button"
          onClick={() => openAutofill(NEW_SENTINEL)}
        >
          New Autofill Rule
        </Button>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading rules…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && scopedRules.length === 0
        ? (
          <p className="text-muted-foreground">
            {categoryId
              ? "No autofill rules add bookmarks to this category yet. Create one above."
              : propertyId
                ? "No autofill rules set this property yet. Create one above."
                : "No autofill rules yet. Create one above."}
          </p>
        )
        : null}
      {!isLoading && scopedRules.length > 0 && visibleRules.length === 0
        ? <p className="text-muted-foreground">No rules match these filters.</p>
        : null}

      <div className="space-y-3">
        {visibleRules.map(rule => (
          <RuleListItem
            key={rule.id}
            rule={rule}
            categories={categories ?? []}
          />
        ))}
      </div>
    </section>
  );
}

interface RuleListItemProps {
  rule: AutofillRule;
  categories: Category[];
}

/** A single read-only rule card that navigates to the rule's full-page view. */
function RuleListItem({
  rule, categories,
}: RuleListItemProps) {
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  const categoryName = rule.setCategoryId
    ? categories.find(category => category.id === rule.setCategoryId)?.name
    : null;

  return (
    <Link
      to="/autofill/$ruleSlug"
      params={{
        ruleSlug: rule.slug,
      }}
      title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
      onClick={event => viewClick(event, "autofill", rule.id)}
      className="block w-full text-left"
    >
      <Card
        className="
          transition-colors
          hover:border-ring hover:bg-accent/40
        "
      >
        <CardHeader
          className="flex-row flex-wrap items-center gap-2 space-y-0"
        >
          <CardTitle>{rule.name}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {summarizeConditions(rule.conditions)}
          </span>
          {categoryName ? <Badge variant="secondary">{categoryName}</Badge> : null}
        </CardHeader>
      </Card>
    </Link>
  );
}
