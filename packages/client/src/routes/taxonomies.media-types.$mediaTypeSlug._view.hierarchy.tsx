import { createFileRoute } from "@tanstack/react-router";

import { mediaTypeWorkbench } from "../components/workbench/mediaType";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/_view/hierarchy")({
  component: HierarchyViewTab,
});

function HierarchyViewTab() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={mediaTypeWorkbench}
      tabKey="hierarchy"
      mode="view"
      slug={mediaTypeSlug}
    />
  );
}
