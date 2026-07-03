import { createFileRoute } from "@tanstack/react-router";

import { albumWorkbench } from "../components/workbench/album";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/albums/$albumSlug/_view/general",
)({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    albumSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={albumWorkbench}
      tabKey="general"
      mode="view"
      slug={albumSlug}
    />
  );
}
