import { createFileRoute } from "@tanstack/react-router";

import { authorWorkbench } from "../components/workbench/author";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/authors/$authorSlug/_view/publishers")({
  component: PublishersViewTab,
});

function PublishersViewTab() {
  const {
    authorSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={authorWorkbench}
      tabKey="publishers"
      mode="view"
      slug={authorSlug}
    />
  );
}
