import { createFileRoute } from "@tanstack/react-router";

import { groupWorkbench } from "../components/workbench/group";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/groups/$groupSlug/edit/people")({
  component: PeopleEditTab,
});

function PeopleEditTab() {
  const {
    groupSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={groupWorkbench}
      tabKey="people"
      mode="edit"
      slug={groupSlug}
    />
  );
}
