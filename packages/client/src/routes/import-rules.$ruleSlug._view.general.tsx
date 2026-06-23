import { createFileRoute } from "@tanstack/react-router";

import { importRuleWorkbench } from "../components/workbench/importRule";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/import-rules/$ruleSlug/_view/general")({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    ruleSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={importRuleWorkbench}
      tabKey="general"
      mode="view"
      slug={ruleSlug}
    />
  );
}
