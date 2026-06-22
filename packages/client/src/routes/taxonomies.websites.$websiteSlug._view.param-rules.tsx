import { createFileRoute } from "@tanstack/react-router";

import { websiteWorkbench } from "../components/workbench/website";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/_view/param-rules")({
  component: ParamRulesViewTab,
});

function ParamRulesViewTab() {
  const {
    websiteSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={websiteWorkbench}
      tabKey="param-rules"
      mode="view"
      slug={websiteSlug}
    />
  );
}
