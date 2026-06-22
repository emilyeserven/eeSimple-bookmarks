import { createFileRoute } from "@tanstack/react-router";

import { propertyGroupWorkbench } from "../components/workbench/propertyGroup";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/property-groups/$propertyGroupSlug/edit/general",
)({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    propertyGroupSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={propertyGroupWorkbench}
      tabKey="general"
      mode="edit"
      slug={propertyGroupSlug}
    />
  );
}
