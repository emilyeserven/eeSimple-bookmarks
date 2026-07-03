import { createFileRoute } from "@tanstack/react-router";

import { groupTypeWorkbench } from "../components/workbench/groupType";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/group-types/$groupTypeSlug/edit/general",
)({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    groupTypeSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={groupTypeWorkbench}
      tabKey="general"
      mode="edit"
      slug={groupTypeSlug}
    />
  );
}
