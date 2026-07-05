import type { CreateImportRuleInput } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { usePanelControls } from "./usePanelControls";
import { useCreateImportRule } from "../../hooks/useImportRules";
import { ImportRuleForm } from "../ImportRuleForm";

/** Inline create form for the right panel: on success, re-targets the panel at the new rule. */
export function CreateImportRule() {
  const {
    t,
  } = useTranslation();
  const {
    openItem,
  } = usePanelControls();
  const createRule = useCreateImportRule();

  async function handleCreate(input: CreateImportRuleInput) {
    const created = await createRule.mutateAsync(input);
    openItem("import-rule", created.id, "edit");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{t("New import rule")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Match a candidate URL during inbox ingestion to automatically approve, reject, or block it.")}
        </p>
      </div>
      <ImportRuleForm
        submitLabel={t("Add rule")}
        isError={createRule.isError}
        errorMessage={createRule.error?.message}
        onSubmit={(input) => {
          void handleCreate(input);
        }}
      />
    </div>
  );
}
