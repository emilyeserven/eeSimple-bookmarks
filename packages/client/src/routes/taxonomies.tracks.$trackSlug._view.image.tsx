import { createFileRoute } from "@tanstack/react-router";

import { trackWorkbench } from "../components/workbench/track";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/tracks/$trackSlug/_view/image",
)({
  component: ImageViewTab,
});

function ImageViewTab() {
  const {
    trackSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={trackWorkbench}
      tabKey="image"
      mode="view"
      slug={trackSlug}
    />
  );
}
