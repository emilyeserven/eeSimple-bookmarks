import { createFileRoute } from "@tanstack/react-router";

import { episodeWorkbench } from "../components/workbench/episode";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/episodes/$episodeSlug/edit/image",
)({
  component: ImageEditTab,
});

function ImageEditTab() {
  const {
    episodeSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={episodeWorkbench}
      tabKey="image"
      mode="edit"
      slug={episodeSlug}
    />
  );
}
