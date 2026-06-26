import { createFileRoute } from "@tanstack/react-router";

import { savedFilterWorkbench } from "../components/workbench/savedFilter";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/saved-filters/$filterSlug/_view/general")({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    filterSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={savedFilterWorkbench}
      tabKey="general"
      mode="view"
      slug={filterSlug}
    />
  );
}
