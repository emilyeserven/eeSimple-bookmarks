import { createFileRoute } from "@tanstack/react-router";

import { podcastWorkbench } from "../components/workbench/podcast";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/podcasts/$podcastSlug/edit/image",
)({
  component: ImageEditTab,
});

function ImageEditTab() {
  const {
    podcastSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={podcastWorkbench}
      tabKey="image"
      mode="edit"
      slug={podcastSlug}
    />
  );
}
