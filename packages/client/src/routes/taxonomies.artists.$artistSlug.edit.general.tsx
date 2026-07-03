import { createFileRoute } from "@tanstack/react-router";

import { artistWorkbench } from "../components/workbench/artist";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/artists/$artistSlug/edit/general",
)({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    artistSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={artistWorkbench}
      tabKey="general"
      mode="edit"
      slug={artistSlug}
    />
  );
}
