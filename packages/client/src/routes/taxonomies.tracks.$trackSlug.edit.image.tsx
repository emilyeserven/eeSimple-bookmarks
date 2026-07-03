import { createFileRoute } from "@tanstack/react-router";

import { trackWorkbench } from "../components/workbench/track";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/tracks/$trackSlug/edit/image",
)({
  component: ImageEditTab,
});

function ImageEditTab() {
  const {
    trackSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={trackWorkbench}
      tabKey="image"
      mode="edit"
      slug={trackSlug}
    />
  );
}
