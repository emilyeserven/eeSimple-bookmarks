import { createFileRoute } from "@tanstack/react-router";

import { tvShowWorkbench } from "../components/workbench/tvShow";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/tv-shows/$tvShowSlug/edit/general",
)({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    tvShowSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={tvShowWorkbench}
      tabKey="general"
      mode="edit"
      slug={tvShowSlug}
    />
  );
}
