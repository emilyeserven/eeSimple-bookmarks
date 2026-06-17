import type {
  AutofillRule,
  Category,
  CreateAutofillRuleInput,
  CustomProperty,
  TagNode,
} from "@eesimple/types";

import { useMemo, useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import { AutofillRuleForm, NO_CATEGORY, OPERATOR_LABELS } from "./AutofillRuleForm";
import {
  useAutofillRules,
  useCreateAutofillRule,
} from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTagTree } from "../hooks/useTags";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Select sentinel for "show rules for every category". */
const ALL_CATEGORIES = "all";

interface AutofillRulesListProps {
  /**
   * When set, scopes the list to a single category: only rules that set this category are
   * shown, the category filter is hidden, and new rules default their target category to it.
   */
  categoryId?: string;
}

/** Read-only, searchable/filterable list of autofill rules with a "new rule" modal. */
export function AutofillRulesList({
  categoryId,
}: AutofillRulesListProps = {}) {
  const {
    data: rules, isLoading, error,
  } = useAutofillRules();
  const {
    data: categories,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: tagTree,
  } = useTagTree();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);

  // Scope to the category in context (category edit tab) before any search/category filtering.
  const scopedRules = useMemo(
    () => (categoryId
      ? (rules ?? []).filter(rule => rule.setCategoryId === categoryId)
      : (rules ?? [])),
    [rules, categoryId],
  );

  const visibleRules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return scopedRules.filter((rule) => {
      const matchesSearch = query === ""
        || rule.name.toLowerCase().includes(query)
        || rule.pattern.toLowerCase().includes(query);
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
          {categoryId
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

        <NewAutofillRuleDialog
          categories={categories ?? []}
          properties={properties ?? []}
          tagTree={tagTree ?? []}
          defaultCategoryId={categoryId}
        />
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading rules…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && scopedRules.length === 0
        ? (
          <p className="text-muted-foreground">
            {categoryId
              ? "No autofill rules add bookmarks to this category yet. Create one above."
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

/** A single read-only rule card linking to its own edit page. */
function RuleListItem({
  rule, categories,
}: RuleListItemProps) {
  const categoryName = rule.setCategoryId
    ? categories.find(category => category.id === rule.setCategoryId)?.name
    : null;
  const fieldLabel = rule.operator === "domain" ? "URL" : rule.field === "url" ? "URL" : "Title";

  return (
    <Link
      to="/settings/autofill/$ruleId"
      params={{
        ruleId: rule.id,
      }}
      className="block"
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
            {`${fieldLabel} ${OPERATOR_LABELS[rule.operator]} “${rule.pattern}”`}
          </span>
          {categoryName ? <Badge variant="secondary">{categoryName}</Badge> : null}
        </CardHeader>
      </Card>
    </Link>
  );
}

interface NewAutofillRuleDialogProps {
  categories: Category[];
  properties: CustomProperty[];
  tagTree: TagNode[];
  defaultCategoryId?: string;
}

/** "New Autofill Rule" button that opens a modal with the create form. */
function NewAutofillRuleDialog({
  categories, properties, tagTree, defaultCategoryId,
}: NewAutofillRuleDialogProps) {
  const navigate = useNavigate();
  const createRule = useCreateAutofillRule();
  const [open, setOpen] = useState(false);

  async function handleCreate(input: CreateAutofillRuleInput) {
    const created = await createRule.mutateAsync(input);
    setOpen(false);
    await navigate({
      to: "/settings/autofill/$ruleId",
      params: {
        ruleId: created.id,
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <Button
        type="button"
        onClick={() => setOpen(true)}
      >
        New Autofill Rule
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Autofill Rule</DialogTitle>
          <DialogDescription>
            Match a bookmark’s URL or title to prefill its category, tags, and custom properties.
          </DialogDescription>
        </DialogHeader>
        <AutofillRuleForm
          categories={categories}
          properties={properties}
          tagTree={tagTree}
          defaultCategoryId={defaultCategoryId}
          submitLabel="Add rule"
          isError={createRule.isError}
          errorMessage={createRule.error?.message}
          onSubmit={(input) => {
            void handleCreate(input);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
