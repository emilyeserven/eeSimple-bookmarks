import { createFileRoute } from "@tanstack/react-router";

import { locationWorkbench } from "../components/workbench/location";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/locations/$locationSlug/edit/display-rules")({
  component: DisplayRulesEditTab,
});

function DisplayRulesEditTab() {
  const {
    locationSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={locationWorkbench}
      tabKey="display-rules"
      mode="edit"
      slug={locationSlug}
    />
  );
}
