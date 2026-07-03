import { createFileRoute } from "@tanstack/react-router";

import { movieWorkbench } from "../components/workbench/movie";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/movies/$movieSlug/_view/general",
)({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    movieSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={movieWorkbench}
      tabKey="general"
      mode="view"
      slug={movieSlug}
    />
  );
}
