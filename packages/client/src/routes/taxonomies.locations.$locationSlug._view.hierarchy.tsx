import { createFileRoute } from "@tanstack/react-router";

import { locationWorkbench } from "../components/workbench/location";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/locations/$locationSlug/_view/hierarchy")({
  component: HierarchyViewTab,
});

function HierarchyViewTab() {
  const {
    locationSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={locationWorkbench}
      tabKey="hierarchy"
      mode="view"
      slug={locationSlug}
    />
  );
}
