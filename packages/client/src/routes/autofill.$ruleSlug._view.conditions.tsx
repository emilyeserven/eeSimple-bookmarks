import { createFileRoute } from "@tanstack/react-router";

import { autofillWorkbench } from "../components/workbench/autofill";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/autofill/$ruleSlug/_view/conditions")({
  component: ConditionsViewTab,
});

function ConditionsViewTab() {
  const {
    ruleSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={autofillWorkbench}
      tabKey="conditions"
      mode="view"
      slug={ruleSlug}
    />
  );
}
