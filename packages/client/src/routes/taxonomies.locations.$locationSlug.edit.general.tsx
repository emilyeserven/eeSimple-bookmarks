import { createFileRoute } from "@tanstack/react-router";

import { locationWorkbench } from "../components/workbench/location";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/locations/$locationSlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    locationSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={locationWorkbench}
      tabKey="general"
      mode="edit"
      slug={locationSlug}
    />
  );
}
