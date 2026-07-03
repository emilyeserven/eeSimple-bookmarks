import { createFileRoute } from "@tanstack/react-router";

import { podcastWorkbench } from "../components/workbench/podcast";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/podcasts/$podcastSlug/edit/general",
)({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    podcastSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={podcastWorkbench}
      tabKey="general"
      mode="edit"
      slug={podcastSlug}
    />
  );
}
