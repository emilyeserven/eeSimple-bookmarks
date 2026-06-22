import { createFileRoute } from "@tanstack/react-router";

import { autofillWorkbench } from "../components/workbench/autofill";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/autofill/$ruleSlug/_view/prefill")({
  component: PrefillViewTab,
});

function PrefillViewTab() {
  const {
    ruleSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={autofillWorkbench}
      tabKey="prefill"
      mode="view"
      slug={ruleSlug}
    />
  );
}
