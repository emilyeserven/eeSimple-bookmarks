import { createFileRoute } from "@tanstack/react-router";

import { placeTypeWorkbench } from "../components/workbench/placeType";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/place-types/$placeTypeSlug/_view/general",
)({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    placeTypeSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={placeTypeWorkbench}
      tabKey="general"
      mode="view"
      slug={placeTypeSlug}
    />
  );
}
