import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useImportRuleBySlug } from "../hooks/useImportRules";

export const Route = createFileRoute("/import-rules/$ruleSlug/edit")({
  component: ImportRuleEditLayout,
});

function ImportRuleEditLayout() {
  const {
    ruleSlug,
  } = Route.useParams();
  const {
    rule, isLoading,
  } = useImportRuleBySlug(ruleSlug);

  const editNav = [
    {
      to: "/import-rules/$ruleSlug/edit/general",
      label: "General",
    },
    {
      to: "/import-rules/$ruleSlug/edit/conditions",
      label: "Conditions",
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
            ← Back to import rule
          </Link>
          <h1 className="text-2xl font-bold">
            {isLoading ? "Edit import rule" : (rule?.name ?? "Import rule not found")}
          </h1>
          <p className="text-sm text-muted-foreground">
            Edit the general details and conditions for this rule.
          </p>
        </div>
      )}
      nav={editNav}
      params={{
        ruleSlug,
      }}
      navAriaLabel="Import rule edit sections"
    />
  );
}
