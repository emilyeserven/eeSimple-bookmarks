import { createFileRoute } from "@tanstack/react-router";

import { autofillWorkbench } from "../components/workbench/autofill";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/autofill/$ruleSlug/edit/conditions")({
  component: ConditionsEditTab,
});

function ConditionsEditTab() {
  const {
    ruleSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={autofillWorkbench}
      tabKey="conditions"
      mode="edit"
      slug={ruleSlug}
    />
  );
}
