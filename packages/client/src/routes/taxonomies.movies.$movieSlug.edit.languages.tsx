import { createFileRoute } from "@tanstack/react-router";

import { movieWorkbench } from "../components/workbench/movie";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/movies/$movieSlug/edit/languages")({
  component: LanguagesEditTab,
});

function LanguagesEditTab() {
  const {
    movieSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={movieWorkbench}
      tabKey="languages"
      mode="edit"
      slug={movieSlug}
    />
  );
}
