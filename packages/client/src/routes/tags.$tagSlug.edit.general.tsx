import { createFileRoute } from "@tanstack/react-router";

import { tagWorkbench } from "../components/workbench/tag";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/tags/$tagSlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    tagSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={tagWorkbench}
      tabKey="general"
      mode="edit"
      slug={tagSlug}
    />
  );
}
