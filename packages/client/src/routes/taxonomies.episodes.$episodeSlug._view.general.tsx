import { createFileRoute } from "@tanstack/react-router";

import { episodeWorkbench } from "../components/workbench/episode";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/episodes/$episodeSlug/_view/general",
)({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    episodeSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={episodeWorkbench}
      tabKey="general"
      mode="view"
      slug={episodeSlug}
    />
  );
}
