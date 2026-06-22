import { createFileRoute } from "@tanstack/react-router";

import { autofillWorkbench } from "../components/workbench/autofill";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/autofill/$ruleSlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    ruleSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={autofillWorkbench}
      tabKey="general"
      mode="edit"
      slug={ruleSlug}
    />
  );
}
