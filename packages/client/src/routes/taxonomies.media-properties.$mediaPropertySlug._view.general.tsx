import { createFileRoute } from "@tanstack/react-router";

import { mediaPropertyWorkbench } from "../components/workbench/mediaProperty";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/media-properties/$mediaPropertySlug/_view/general",
)({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    mediaPropertySlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={mediaPropertyWorkbench}
      tabKey="general"
      mode="view"
      slug={mediaPropertySlug}
    />
  );
}
