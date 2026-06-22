import { createFileRoute } from "@tanstack/react-router";

import { tagWorkbench } from "../components/workbench/tag";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/tags/$tagSlug/_view/general")({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    tagSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={tagWorkbench}
      tabKey="general"
      mode="view"
      slug={tagSlug}
    />
  );
}
