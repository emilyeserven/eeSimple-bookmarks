import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useImportRuleBySlug } from "../hooks/useImportRules";

export const Route = createFileRoute("/import-rules/$ruleSlug/edit")({
  component: ImportRuleEditLayout,
});

function ImportRuleEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    ruleSlug,
  } = Route.useParams();
  const {
    rule, isLoading,
  } = useImportRuleBySlug(ruleSlug);

  const editNav = [
    {
      to: "/import-rules/$ruleSlug/edit/general",
      label: t("General"),
    },
    {
      to: "/import-rules/$ruleSlug/edit/conditions",
      label: t("Conditions"),
    },
  ] as const;

  return (
    <TabbedEntityLayout
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
      nav={editNav}
      params={{
        ruleSlug,
      }}
      navAriaLabel={t("Import rule edit sections")}
    />
  );
}
