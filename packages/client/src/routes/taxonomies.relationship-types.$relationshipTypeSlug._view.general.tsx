import { createFileRoute } from "@tanstack/react-router";

import { relationshipTypeWorkbench } from "../components/workbench/relationshipType";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/relationship-types/$relationshipTypeSlug/_view/general",
)({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    relationshipTypeSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={relationshipTypeWorkbench}
      tabKey="general"
      mode="view"
      slug={relationshipTypeSlug}
    />
  );
}
