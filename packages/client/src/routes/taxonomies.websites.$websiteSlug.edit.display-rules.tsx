import { createFileRoute } from "@tanstack/react-router";

import { websiteWorkbench } from "../components/workbench/website";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/edit/display-rules")({
  component: DisplayRulesEditTab,
});

function DisplayRulesEditTab() {
  const {
    websiteSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={websiteWorkbench}
      tabKey="display-rules"
      mode="edit"
      slug={websiteSlug}
    />
  );
}
