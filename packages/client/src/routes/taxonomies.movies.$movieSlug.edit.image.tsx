import { createFileRoute } from "@tanstack/react-router";

import { movieWorkbench } from "../components/workbench/movie";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/movies/$movieSlug/edit/image",
)({
  component: ImageEditTab,
});

function ImageEditTab() {
  const {
    movieSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={movieWorkbench}
      tabKey="image"
      mode="edit"
      slug={movieSlug}
    />
  );
}
