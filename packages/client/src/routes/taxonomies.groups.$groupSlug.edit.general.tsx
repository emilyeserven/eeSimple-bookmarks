import { createFileRoute } from "@tanstack/react-router";

import { groupWorkbench } from "../components/workbench/group";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/groups/$groupSlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    groupSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={groupWorkbench}
      tabKey="general"
      mode="edit"
      slug={groupSlug}
    />
  );
}
