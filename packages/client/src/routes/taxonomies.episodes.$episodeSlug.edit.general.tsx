import { createFileRoute } from "@tanstack/react-router";

import { episodeWorkbench } from "../components/workbench/episode";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/episodes/$episodeSlug/edit/general",
)({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    episodeSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={episodeWorkbench}
      tabKey="general"
      mode="edit"
      slug={episodeSlug}
    />
  );
}
