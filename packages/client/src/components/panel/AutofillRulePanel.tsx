import { CreateAutofillRule, EditAutofillRule } from "./AutofillRuleForms";
import { usePanelControls } from "./usePanelControls";
import { usePanelDismissAfterDelete } from "./usePanelDismissAfterDelete";
import {
  useAutofillRuleById,
  useDeleteAutofillRule,
} from "../../hooks/useAutofill";
import { useCategories } from "../../hooks/useCategories";
import { AutofillRuleDetail } from "../AutofillRuleDetail";

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
