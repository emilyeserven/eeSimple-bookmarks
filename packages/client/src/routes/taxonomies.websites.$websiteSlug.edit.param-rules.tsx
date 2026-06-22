import { createFileRoute } from "@tanstack/react-router";

import { websiteWorkbench } from "../components/workbench/website";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/edit/param-rules")({
  component: ParamRulesEditTab,
});

function ParamRulesEditTab() {
  const {
    websiteSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={websiteWorkbench}
      tabKey="param-rules"
      mode="edit"
      slug={websiteSlug}
    />
  );
}
