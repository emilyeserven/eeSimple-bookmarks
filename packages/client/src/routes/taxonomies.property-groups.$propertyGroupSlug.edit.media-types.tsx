import { createFileRoute } from "@tanstack/react-router";

import { propertyGroupWorkbench } from "../components/workbench/propertyGroup";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/property-groups/$propertyGroupSlug/edit/media-types",
)({
  component: MediaTypesEditTab,
});

function MediaTypesEditTab() {
  const {
    propertyGroupSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={propertyGroupWorkbench}
      tabKey="media-types"
      mode="edit"
      slug={propertyGroupSlug}
    />
  );
}
