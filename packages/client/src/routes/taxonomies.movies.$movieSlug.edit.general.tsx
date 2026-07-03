import { createFileRoute } from "@tanstack/react-router";

import { movieWorkbench } from "../components/workbench/movie";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/movies/$movieSlug/edit/general",
)({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    movieSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={movieWorkbench}
      tabKey="general"
      mode="edit"
      slug={movieSlug}
    />
  );
}
