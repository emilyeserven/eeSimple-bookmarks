import { createFileRoute } from "@tanstack/react-router";

import { trackWorkbench } from "../components/workbench/track";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/tracks/$trackSlug/edit/general",
)({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    trackSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={trackWorkbench}
      tabKey="general"
      mode="edit"
      slug={trackSlug}
    />
  );
}
