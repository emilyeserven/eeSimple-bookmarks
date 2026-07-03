import { createFileRoute } from "@tanstack/react-router";

import { personWorkbench } from "../components/workbench/person";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/people/$personSlug/edit/groups")({
  component: GroupsEditTab,
});

function GroupsEditTab() {
  const {
    personSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={personWorkbench}
      tabKey="groups"
      mode="edit"
      slug={personSlug}
    />
  );
}
