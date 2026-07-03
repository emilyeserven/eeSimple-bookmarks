import { createFileRoute } from "@tanstack/react-router";

import { publisherWorkbench } from "../components/workbench/publisher";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/publishers/$publisherSlug/_view/people")({
  component: PeopleViewTab,
});

function PeopleViewTab() {
  const {
    publisherSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={publisherWorkbench}
      tabKey="people"
      mode="view"
      slug={publisherSlug}
    />
  );
}
