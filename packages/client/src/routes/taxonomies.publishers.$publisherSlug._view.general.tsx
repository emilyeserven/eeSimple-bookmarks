import { createFileRoute } from "@tanstack/react-router";

import { publisherWorkbench } from "../components/workbench/publisher";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/publishers/$publisherSlug/_view/general")({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    publisherSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={publisherWorkbench}
      tabKey="general"
      mode="view"
      slug={publisherSlug}
    />
  );
}
