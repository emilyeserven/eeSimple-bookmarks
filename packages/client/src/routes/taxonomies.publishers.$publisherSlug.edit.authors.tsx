import { createFileRoute } from "@tanstack/react-router";

import { publisherWorkbench } from "../components/workbench/publisher";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/publishers/$publisherSlug/edit/authors")({
  component: AuthorsEditTab,
});

function AuthorsEditTab() {
  const {
    publisherSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={publisherWorkbench}
      tabKey="authors"
      mode="edit"
      slug={publisherSlug}
    />
  );
}
