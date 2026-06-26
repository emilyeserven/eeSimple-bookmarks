import { createFileRoute } from "@tanstack/react-router";

import { savedFilterWorkbench } from "../components/workbench/savedFilter";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/saved-filters/$filterSlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    filterSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={savedFilterWorkbench}
      tabKey="general"
      mode="edit"
      slug={filterSlug}
    />
  );
}
