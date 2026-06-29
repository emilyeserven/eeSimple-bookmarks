import { createFileRoute } from "@tanstack/react-router";

import { cardDisplayRuleWorkbench } from "../components/workbench/cardDisplayRule";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/card-display-rules/$ruleSlug/edit/display")({
  component: DisplayEditTab,
});

function DisplayEditTab() {
  const {
    ruleSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={cardDisplayRuleWorkbench}
      tabKey="display"
      mode="edit"
      slug={ruleSlug}
    />
  );
}
