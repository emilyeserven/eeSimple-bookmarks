import { createFileRoute } from "@tanstack/react-router";

import { autofillWorkbench } from "../components/workbench/autofill";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/autofill/$ruleSlug/_view/general")({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    ruleSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={autofillWorkbench}
      tabKey="general"
      mode="view"
      slug={ruleSlug}
    />
  );
}
