import { createFileRoute } from "@tanstack/react-router";

import { propertyWorkbench } from "../components/workbench/property";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/custom-properties/$propertySlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    propertySlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={propertyWorkbench}
      tabKey="general"
      mode="edit"
      slug={propertySlug}
    />
  );
}
