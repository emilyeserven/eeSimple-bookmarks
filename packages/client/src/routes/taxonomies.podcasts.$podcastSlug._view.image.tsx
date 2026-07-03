import { createFileRoute } from "@tanstack/react-router";

import { podcastWorkbench } from "../components/workbench/podcast";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/podcasts/$podcastSlug/_view/image",
)({
  component: ImageViewTab,
});

function ImageViewTab() {
  const {
    podcastSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={podcastWorkbench}
      tabKey="image"
      mode="view"
      slug={podcastSlug}
    />
  );
}
