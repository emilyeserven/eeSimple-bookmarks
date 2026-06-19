import type { CreateAutofillRuleInput } from "@eesimple/types";

import { useParams } from "@tanstack/react-router";

import { usePanelControls } from "./usePanelControls";
import { usePanelDismissAfterDelete } from "./usePanelDismissAfterDelete";
import {
  useAutofillRuleById,
  useCreateAutofillRule,
  useDeleteAutofillRule,
  useUpdateAutofillRule,
} from "../../hooks/useAutofill";
import { useCategories } from "../../hooks/useCategories";
import { useCustomProperties } from "../../hooks/useCustomProperties";
import { useTagBySlug, useTagTree } from "../../hooks/useTags";
import { useWebsites } from "../../hooks/useWebsites";
import { AutofillRuleForm } from "../AutofillRuleForm";

import { Button } from "@/components/ui/button";

/** Create form: on success, re-target the panel at the saved rule so editing continues inline. */
export function CreateAutofillRule() {
  const {
    openAutofill,
  } = usePanelControls();
  const {
    data: categories,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: websites,
  } = useWebsites();
  const createRule = useCreateAutofillRule();

  // When opened from a category's / website's / tag's autofill tab the slug is still in the route
  // path; preselect that entity so the new rule shows up in the scoped list. Undefined on every
  // other surface (e.g. /settings/autofill), leaving the defaults unchanged.
  const {
    categorySlug,
    websiteSlug,
    tagSlug,
  } = useParams({
    strict: false,
  });
  // useTagBySlug is safe to call unconditionally (returns undefined when slug is empty).
  const {
    tag: preseedTag,
  } = useTagBySlug(tagSlug ?? "");
  const defaultCategoryId = categorySlug
    ? (categories ?? []).find(category => category.slug === categorySlug)?.id
    : undefined;
  const defaultWebsiteDomain = websiteSlug
    ? (websites ?? []).find(site => site.slug === websiteSlug)?.domain
    : undefined;
  const defaultTagIds = tagSlug && preseedTag ? [preseedTag.id] : undefined;

  async function handleCreate(input: CreateAutofillRuleInput) {
    const created = await createRule.mutateAsync(input);
    openAutofill(created.id);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">New autofill rule</h2>
        <p className="text-sm text-muted-foreground">
          Match a bookmark’s title or website to prefill its category, tags, and custom properties.
        </p>
      </div>
      <AutofillRuleForm
        categories={categories ?? []}
        properties={properties ?? []}
        tagTree={tagTree ?? []}
        defaultCategoryId={defaultCategoryId}
        defaultWebsiteDomain={defaultWebsiteDomain}
        defaultTagIds={defaultTagIds}
        submitLabel="Add rule"
        isError={createRule.isError}
        errorMessage={createRule.error?.message}
        onSubmit={(input) => {
          void handleCreate(input);
        }}
      />
    </div>
  );
}

interface EditAutofillRuleProps {
  ruleId: string;
}

/** Edit form for an existing rule, plus a destructive delete that closes the panel. */
export function EditAutofillRule({
  ruleId,
}: EditAutofillRuleProps) {
  const dismiss = usePanelDismissAfterDelete();
  const {
    rule, isLoading, error,
  } = useAutofillRuleById(ruleId);
  const {
    data: categories,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: tagTree,
  } = useTagTree();
  const updateRule = useUpdateAutofillRule();
  const deleteRule = useDeleteAutofillRule();

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-destructive">{error.message}</p>;
  if (!rule) return <p className="text-destructive">Rule not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">{rule.name}</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() =>
            deleteRule.mutate(rule.id, {
              onSuccess: dismiss,
            })}
        >
          Delete
        </Button>
      </div>

      <AutofillRuleForm
        rule={rule}
        categories={categories ?? []}
        properties={properties ?? []}
        tagTree={tagTree ?? []}
        submitLabel="Save changes"
        isError={updateRule.isError}
        errorMessage={updateRule.error?.message}
        onSubmit={input =>
          updateRule.mutate({
            id: rule.id,
            input,
          })}
      />
    </div>
  );
}
