import { createFileRoute } from "@tanstack/react-router";

import { albumWorkbench } from "../components/workbench/album";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/albums/$albumSlug/edit/general",
)({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    albumSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={albumWorkbench}
      tabKey="general"
      mode="edit"
      slug={albumSlug}
    />
  );
}
