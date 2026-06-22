import { createFileRoute } from "@tanstack/react-router";

import { propertyWorkbench } from "../components/workbench/property";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/custom-properties/$propertySlug/edit/media-types")({
  component: MediaTypesEditTab,
});

function MediaTypesEditTab() {
  const {
    propertySlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={propertyWorkbench}
      tabKey="media-types"
      mode="edit"
      slug={propertySlug}
    />
  );
}
