import { createFileRoute } from "@tanstack/react-router";

import { locationWorkbench } from "../components/workbench/location";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/locations/$locationSlug/_view/general")({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    locationSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={locationWorkbench}
      tabKey="general"
      mode="view"
      slug={locationSlug}
    />
  );
}
