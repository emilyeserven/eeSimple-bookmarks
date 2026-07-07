import { createFileRoute } from "@tanstack/react-router";

import { locationRelationWorkbench } from "../components/workbench/locationRelation";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/location-relations/$locationRelationSlug/edit/general",
)({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    locationRelationSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={locationRelationWorkbench}
      tabKey="general"
      mode="edit"
      slug={locationRelationSlug}
    />
  );
}
