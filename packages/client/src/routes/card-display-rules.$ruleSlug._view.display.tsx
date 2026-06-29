import { createFileRoute } from "@tanstack/react-router";

import { cardDisplayRuleWorkbench } from "../components/workbench/cardDisplayRule";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/card-display-rules/$ruleSlug/_view/display")({
  component: DisplayViewTab,
});

function DisplayViewTab() {
  const {
    ruleSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={cardDisplayRuleWorkbench}
      tabKey="display"
      mode="view"
      slug={ruleSlug}
    />
  );
}
