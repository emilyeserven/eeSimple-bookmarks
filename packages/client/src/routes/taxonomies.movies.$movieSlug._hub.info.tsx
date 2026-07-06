import { createFileRoute } from "@tanstack/react-router";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { movieWorkbench } from "../components/workbench/movie";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/movies/$movieSlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: MovieInfoTab,
});

function MovieInfoTab() {
  const {
    movieSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={movieWorkbench}
      slug={movieSlug}
      infoTo="/taxonomies/movies/$movieSlug/info"
      params={{
        movieSlug,
      }}
      activeTab={tab}
    />
  );
}
