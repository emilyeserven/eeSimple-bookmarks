import type { CreateAutofillRuleInput } from "@eesimple/types";

import { PanelEntityEditor } from "./PanelEntityEditor";
import { usePanelControls } from "./usePanelControls";
import { usePanelDismissAfterDelete } from "./usePanelDismissAfterDelete";
import {
  useAutofillRuleById,
  useCreateAutofillRule,
  useDeleteAutofillRule,
} from "../../hooks/useAutofill";
import { useAutofillScopeDefaults } from "../../hooks/useAutofillScopeDefaults";
import { useCategories } from "../../hooks/useCategories";
import { useCustomProperties } from "../../hooks/useCustomProperties";
import { useMediaTypes } from "../../hooks/useMediaTypes";
import { useTagTree } from "../../hooks/useTags";
import { AutofillRuleConditionsForm } from "../AutofillRuleConditionsForm";
import { AutofillRuleForm } from "../AutofillRuleForm";
import { AutofillRuleGeneralForm } from "../AutofillRuleGeneralForm";
import { AutofillRulePrefillForm } from "../AutofillRulePrefillForm";
import { LabeledSection } from "../LabeledSection";

import { Separator } from "@/components/ui/separator";

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
    data: mediaTypes,
  } = useMediaTypes();
  const createRule = useCreateAutofillRule();

  // When opened from a category's / website's / tag's / media type's / channel's autofill tab the
  // slug is still in the route path; preselect that entity so the new rule shows up in the scoped
  // list. Undefined on every other surface (e.g. /settings/autofill), leaving the defaults unchanged.
  const {
    categoryId: defaultCategoryId,
    propertyId: defaultPropertyId,
    websiteDomain: defaultWebsiteDomain,
    tagIds: defaultTagIds,
    mediaTypeId: defaultMediaTypeId,
    channelIds: defaultChannelIds,
  } = useAutofillScopeDefaults();

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
        mediaTypes={mediaTypes ?? []}
        properties={properties ?? []}
        tagTree={tagTree ?? []}
        defaultCategoryId={defaultCategoryId}
        defaultMediaTypeId={defaultMediaTypeId}
        defaultWebsiteDomain={defaultWebsiteDomain}
        defaultTagIds={defaultTagIds}
        defaultChannelIds={defaultChannelIds}
        defaultOpenCustomProperties={!!defaultPropertyId}
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

/**
 * Edit an existing rule by reusing the **same** per-tab auto-save forms the main-app edit tabs render
 * (`AutofillRuleGeneralForm` / `AutofillRuleConditionsForm` / `AutofillRulePrefillForm`), stacked
 * since the panel is a single column — not the monolithic submit `AutofillRuleForm` (that stays for
 * create). A destructive delete closes the panel.
 */
export function EditAutofillRule({
  ruleId,
}: EditAutofillRuleProps) {
  const dismiss = usePanelDismissAfterDelete();
  const {
    rule, isLoading, error,
  } = useAutofillRuleById(ruleId);
  const deleteRule = useDeleteAutofillRule();

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-destructive">{error.message}</p>;
  if (!rule) return <p className="text-destructive">Rule not found.</p>;

  return (
    <PanelEntityEditor
      name={rule.name}
      onDelete={() => deleteRule.mutate(rule.id, {
        onSuccess: dismiss,
      })}
      deleteIsPending={deleteRule.isPending}
      deleteError={deleteRule.isError ? deleteRule.error.message : null}
    >
      <div className="space-y-6">
        <LabeledSection
          title="General"
          description="Name, description, and priority."
        >
          <AutofillRuleGeneralForm rule={rule} />
        </LabeledSection>
        <Separator />
        <LabeledSection
          title="Activation Conditions"
          description="Configure when this rule should apply."
        >
          <AutofillRuleConditionsForm rule={rule} />
        </LabeledSection>
        <Separator />
        <LabeledSection
          title="What Gets Prefilled"
          description="Configure the category, tags, and property values this rule sets."
        >
          <AutofillRulePrefillForm rule={rule} />
        </LabeledSection>
      </div>
    </PanelEntityEditor>
  );
}
