import { createFileRoute } from "@tanstack/react-router";

import { tagWorkbench } from "../components/workbench/tag";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/tags/$tagSlug/edit/display-rules")({
  component: DisplayRulesEditTab,
});

function DisplayRulesEditTab() {
  const {
    tagSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={tagWorkbench}
      tabKey="display-rules"
      mode="edit"
      slug={tagSlug}
    />
  );
}
