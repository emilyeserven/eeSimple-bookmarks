import { createFileRoute } from "@tanstack/react-router";

import { artistWorkbench } from "../components/workbench/artist";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/artists/$artistSlug/_view/general",
)({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    artistSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={artistWorkbench}
      tabKey="general"
      mode="view"
      slug={artistSlug}
    />
  );
}
