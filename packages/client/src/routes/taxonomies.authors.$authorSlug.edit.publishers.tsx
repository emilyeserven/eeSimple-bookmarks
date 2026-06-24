import { createFileRoute } from "@tanstack/react-router";

import { authorWorkbench } from "../components/workbench/author";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/authors/$authorSlug/edit/publishers")({
  component: PublishersEditTab,
});

function PublishersEditTab() {
  const {
    authorSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={authorWorkbench}
      tabKey="publishers"
      mode="edit"
      slug={authorSlug}
    />
  );
}
