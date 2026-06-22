import { createFileRoute } from "@tanstack/react-router";

import { propertyGroupWorkbench } from "../components/workbench/propertyGroup";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/property-groups/$propertyGroupSlug/_view/general",
)({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    propertyGroupSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={propertyGroupWorkbench}
      tabKey="general"
      mode="view"
      slug={propertyGroupSlug}
    />
  );
}
