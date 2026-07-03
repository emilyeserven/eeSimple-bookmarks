import { createFileRoute } from "@tanstack/react-router";

import { trackWorkbench } from "../components/workbench/track";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/tracks/$trackSlug/_view/general",
)({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    trackSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={trackWorkbench}
      tabKey="general"
      mode="view"
      slug={trackSlug}
    />
  );
}
