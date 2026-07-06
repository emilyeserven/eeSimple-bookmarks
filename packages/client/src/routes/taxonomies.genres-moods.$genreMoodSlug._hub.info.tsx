import { createFileRoute } from "@tanstack/react-router";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { genreMoodWorkbench } from "../components/workbench/genreMood";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/genres-moods/$genreMoodSlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: GenreMoodInfoTab,
});

function GenreMoodInfoTab() {
  const {
    genreMoodSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={genreMoodWorkbench}
      slug={genreMoodSlug}
      infoTo="/taxonomies/genres-moods/$genreMoodSlug/info"
      params={{
        genreMoodSlug,
      }}
      activeTab={tab}
    />
  );
}
