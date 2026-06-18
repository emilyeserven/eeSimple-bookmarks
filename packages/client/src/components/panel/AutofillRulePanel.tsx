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
import { useTagTree } from "../../hooks/useTags";
import { useWebsites } from "../../hooks/useWebsites";
import { AutofillRuleDetail } from "../AutofillRuleDetail";
import { AutofillRuleForm } from "../AutofillRuleForm";

import { Button } from "@/components/ui/button";
import { NEW_SENTINEL } from "@/lib/drawerSearch";

interface AutofillRulePanelProps {
  /** The rule id to edit, or `NEW_SENTINEL` to create a new rule. */
  ruleId: string;
}

/** Autofill rule create/edit body for the shared panel (was the `$ruleId` page + create drawer). */
export function AutofillRulePanel({
  ruleId,
}: AutofillRulePanelProps) {
  return ruleId === NEW_SENTINEL
    ? <CreateAutofillRule />
    : <EditAutofillRule ruleId={ruleId} />;
}

/** Read-only view of an autofill rule in the panel, with Edit and Delete actions. */
export function ViewAutofillRule({
  ruleId,
}: {
  ruleId: string;
}) {
  const {
    rule, isLoading, error,
  } = useAutofillRuleById(ruleId);
  const {
    data: categories,
  } = useCategories();
  const {
    openItem,
  } = usePanelControls();
  const dismiss = usePanelDismissAfterDelete();
  const deleteRule = useDeleteAutofillRule();

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-destructive">{error.message}</p>;
  if (!rule) return <p className="text-destructive">Rule not found.</p>;

  return (
    <AutofillRuleDetail
      rule={rule}
      categories={categories ?? []}
      onEdit={() => openItem("autofill", ruleId, "edit")}
      onDelete={() => deleteRule.mutate(ruleId, {
        onSuccess: dismiss,
      })}
      deleteIsPending={deleteRule.isPending}
    />
  );
}

/** Create form: on success, re-target the panel at the saved rule so editing continues inline. */
function CreateAutofillRule() {
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

  // When opened from a category's / website's autofill tab the slug is still in the route path;
  // preselect that entity so the new rule shows up in the scoped list. Undefined on every other
  // surface (e.g. /settings/autofill), leaving the defaults unchanged.
  const {
    categorySlug,
    websiteSlug,
  } = useParams({
    strict: false,
  });
  const defaultCategoryId = categorySlug
    ? (categories ?? []).find(category => category.slug === categorySlug)?.id
    : undefined;
  const defaultWebsiteDomain = websiteSlug
    ? (websites ?? []).find(site => site.slug === websiteSlug)?.domain
    : undefined;

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
function EditAutofillRule({
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
