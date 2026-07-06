import { createFileRoute } from "@tanstack/react-router";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { episodeWorkbench } from "../components/workbench/episode";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/episodes/$episodeSlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: EpisodeInfoTab,
});

function EpisodeInfoTab() {
  const {
    episodeSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={episodeWorkbench}
      slug={episodeSlug}
      infoTo="/taxonomies/episodes/$episodeSlug/info"
      params={{
        episodeSlug,
      }}
      activeTab={tab}
    />
  );
}
