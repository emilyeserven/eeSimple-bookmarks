import { createFileRoute } from "@tanstack/react-router";

import { tvShowWorkbench } from "../components/workbench/tvShow";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/tv-shows/$tvShowSlug/edit/image",
)({
  component: ImageEditTab,
});

function ImageEditTab() {
  const {
    tvShowSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={tvShowWorkbench}
      tabKey="image"
      mode="edit"
      slug={tvShowSlug}
    />
  );
}
