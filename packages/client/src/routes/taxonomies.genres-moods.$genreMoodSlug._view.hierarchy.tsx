import { createFileRoute } from "@tanstack/react-router";

import { genreMoodWorkbench } from "../components/workbench/genreMood";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/genres-moods/$genreMoodSlug/_view/hierarchy")({
  component: HierarchyViewTab,
});

function HierarchyViewTab() {
  const {
    genreMoodSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={genreMoodWorkbench}
      tabKey="hierarchy"
      mode="view"
      slug={genreMoodSlug}
    />
  );
}
