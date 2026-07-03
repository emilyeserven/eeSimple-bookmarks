import { createFileRoute } from "@tanstack/react-router";

import { personWorkbench } from "../components/workbench/person";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/people/$personSlug/edit/publishers")({
  component: PublishersEditTab,
});

function PublishersEditTab() {
  const {
    personSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={personWorkbench}
      tabKey="publishers"
      mode="edit"
      slug={personSlug}
    />
  );
}
