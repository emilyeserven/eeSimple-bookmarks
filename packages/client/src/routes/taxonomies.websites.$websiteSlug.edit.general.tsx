import { createFileRoute } from "@tanstack/react-router";

import { websiteWorkbench } from "../components/workbench/website";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    websiteSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={websiteWorkbench}
      tabKey="general"
      mode="edit"
      slug={websiteSlug}
    />
  );
}
