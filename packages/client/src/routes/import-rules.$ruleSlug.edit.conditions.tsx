import { createFileRoute } from "@tanstack/react-router";

import { importRuleWorkbench } from "../components/workbench/importRule";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/import-rules/$ruleSlug/edit/conditions")({
  component: ConditionsEditTab,
});

function ConditionsEditTab() {
  const {
    ruleSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={importRuleWorkbench}
      tabKey="conditions"
      mode="edit"
      slug={ruleSlug}
    />
  );
}
