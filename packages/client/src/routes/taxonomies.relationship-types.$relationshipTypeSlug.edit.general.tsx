import { createFileRoute } from "@tanstack/react-router";

import { relationshipTypeWorkbench } from "../components/workbench/relationshipType";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/relationship-types/$relationshipTypeSlug/edit/general",
)({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    relationshipTypeSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={relationshipTypeWorkbench}
      tabKey="general"
      mode="edit"
      slug={relationshipTypeSlug}
    />
  );
}
