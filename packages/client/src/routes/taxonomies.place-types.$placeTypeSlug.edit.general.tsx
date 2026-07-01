import { createFileRoute } from "@tanstack/react-router";

import { placeTypeWorkbench } from "../components/workbench/placeType";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/place-types/$placeTypeSlug/edit/general",
)({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    placeTypeSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={placeTypeWorkbench}
      tabKey="general"
      mode="edit"
      slug={placeTypeSlug}
    />
  );
}
