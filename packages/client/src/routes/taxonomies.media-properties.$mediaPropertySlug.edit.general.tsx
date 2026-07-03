import { createFileRoute } from "@tanstack/react-router";

import { mediaPropertyWorkbench } from "../components/workbench/mediaProperty";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/media-properties/$mediaPropertySlug/edit/general",
)({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    mediaPropertySlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={mediaPropertyWorkbench}
      tabKey="general"
      mode="edit"
      slug={mediaPropertySlug}
    />
  );
}
