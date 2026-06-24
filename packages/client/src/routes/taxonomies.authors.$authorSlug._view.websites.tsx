import { createFileRoute } from "@tanstack/react-router";

import { authorWorkbench } from "../components/workbench/author";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/authors/$authorSlug/_view/websites")({
  component: WebsitesViewTab,
});

function WebsitesViewTab() {
  const {
    authorSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={authorWorkbench}
      tabKey="websites"
      mode="view"
      slug={authorSlug}
    />
  );
}
