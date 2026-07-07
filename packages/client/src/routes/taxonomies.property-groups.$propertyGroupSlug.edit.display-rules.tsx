import { createFileRoute } from "@tanstack/react-router";

import { propertyGroupWorkbench } from "../components/workbench/propertyGroup";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/property-groups/$propertyGroupSlug/edit/display-rules",
)({
  component: DisplayRulesEditTab,
});

function DisplayRulesEditTab() {
  const {
    propertyGroupSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={propertyGroupWorkbench}
      tabKey="display-rules"
      mode="edit"
      slug={propertyGroupSlug}
    />
  );
}
