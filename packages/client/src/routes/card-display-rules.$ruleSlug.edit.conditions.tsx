import { createFileRoute } from "@tanstack/react-router";

import { cardDisplayRuleWorkbench } from "../components/workbench/cardDisplayRule";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/card-display-rules/$ruleSlug/edit/conditions")({
  component: ConditionsEditTab,
});

function ConditionsEditTab() {
  const {
    ruleSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={cardDisplayRuleWorkbench}
      tabKey="conditions"
      mode="edit"
      slug={ruleSlug}
    />
  );
}
