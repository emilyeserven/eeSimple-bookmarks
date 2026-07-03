import { createFileRoute } from "@tanstack/react-router";

import { genreMoodWorkbench } from "../components/workbench/genreMood";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/genres-moods/$genreMoodSlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    genreMoodSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={genreMoodWorkbench}
      tabKey="general"
      mode="edit"
      slug={genreMoodSlug}
    />
  );
}
