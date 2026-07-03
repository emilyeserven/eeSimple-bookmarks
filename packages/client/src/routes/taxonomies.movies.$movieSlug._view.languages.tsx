import { createFileRoute } from "@tanstack/react-router";

import { movieWorkbench } from "../components/workbench/movie";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/movies/$movieSlug/_view/languages")({
  component: LanguagesViewTab,
});

function LanguagesViewTab() {
  const {
    movieSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={movieWorkbench}
      tabKey="languages"
      mode="view"
      slug={movieSlug}
    />
  );
}
