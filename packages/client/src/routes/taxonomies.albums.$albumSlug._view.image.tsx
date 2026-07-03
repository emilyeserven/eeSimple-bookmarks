import { createFileRoute } from "@tanstack/react-router";

import { albumWorkbench } from "../components/workbench/album";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/albums/$albumSlug/_view/image",
)({
  component: ImageViewTab,
});

function ImageViewTab() {
  const {
    albumSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={albumWorkbench}
      tabKey="image"
      mode="view"
      slug={albumSlug}
    />
  );
}
