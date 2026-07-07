import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { importRuleWorkbench } from "../components/workbench/importRule";
import { useImportRuleBySlug } from "../hooks/useImportRules";

import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/import-rules/$ruleSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: ImportRuleEditPage,
});

function ImportRuleEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    ruleSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    rule, isLoading,
  } = useImportRuleBySlug(ruleSlug);

  return (
    <EntityEditView
      workbench={importRuleWorkbench}
      slug={ruleSlug}
      editTo="/import-rules/$ruleSlug/edit"
      params={{
        ruleSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/import-rules/$ruleSlug"
            params={{
              ruleSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to import rule")}
          </Link>
          <h1 className="text-2xl font-bold">
            {isLoading ? t("Edit import rule") : (rule?.name ?? t("Import rule not found"))}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("Edit the general details and conditions for this rule.")}
          </p>
        </div>
      )}
    />
  );
}
