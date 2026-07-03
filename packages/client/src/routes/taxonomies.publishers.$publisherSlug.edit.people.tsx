import { createFileRoute } from "@tanstack/react-router";

import { publisherWorkbench } from "../components/workbench/publisher";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/publishers/$publisherSlug/edit/people")({
  component: PeopleEditTab,
});

function PeopleEditTab() {
  const {
    publisherSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={publisherWorkbench}
      tabKey="people"
      mode="edit"
      slug={publisherSlug}
    />
  );
}
