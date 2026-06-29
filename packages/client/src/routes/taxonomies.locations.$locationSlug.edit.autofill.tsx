import { createFileRoute } from "@tanstack/react-router";

import { locationWorkbench } from "../components/workbench/location";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/locations/$locationSlug/edit/autofill")({
  component: AutofillEditTab,
});

function AutofillEditTab() {
  const {
    locationSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={locationWorkbench}
      tabKey="autofill"
      mode="edit"
      slug={locationSlug}
    />
  );
}
