import { createFileRoute } from "@tanstack/react-router";

import { publisherWorkbench } from "../components/workbench/publisher";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/publishers/$publisherSlug/_view/authors")({
  component: AuthorsViewTab,
});

function AuthorsViewTab() {
  const {
    publisherSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={publisherWorkbench}
      tabKey="authors"
      mode="view"
      slug={publisherSlug}
    />
  );
}
