import { createFileRoute } from "@tanstack/react-router";

import { importRuleWorkbench } from "../components/workbench/importRule";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/import-rules/$ruleSlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    ruleSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={importRuleWorkbench}
      tabKey="general"
      mode="edit"
      slug={ruleSlug}
    />
  );
}
