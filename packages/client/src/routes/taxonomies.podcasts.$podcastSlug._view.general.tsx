import { createFileRoute } from "@tanstack/react-router";

import { podcastWorkbench } from "../components/workbench/podcast";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/podcasts/$podcastSlug/_view/general",
)({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    podcastSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={podcastWorkbench}
      tabKey="general"
      mode="view"
      slug={podcastSlug}
    />
  );
}
