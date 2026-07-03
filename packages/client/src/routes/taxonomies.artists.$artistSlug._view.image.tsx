import { createFileRoute } from "@tanstack/react-router";

import { artistWorkbench } from "../components/workbench/artist";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/artists/$artistSlug/_view/image",
)({
  component: ImageViewTab,
});

function ImageViewTab() {
  const {
    artistSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={artistWorkbench}
      tabKey="image"
      mode="view"
      slug={artistSlug}
    />
  );
}
