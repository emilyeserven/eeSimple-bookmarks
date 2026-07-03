import { createFileRoute } from "@tanstack/react-router";

import { personWorkbench } from "../components/workbench/person";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/people/$personSlug/_view/groups")({
  component: GroupsViewTab,
});

function GroupsViewTab() {
  const {
    personSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={personWorkbench}
      tabKey="groups"
      mode="view"
      slug={personSlug}
    />
  );
}
