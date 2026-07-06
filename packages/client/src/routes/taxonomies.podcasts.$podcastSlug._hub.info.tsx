import { createFileRoute } from "@tanstack/react-router";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { podcastWorkbench } from "../components/workbench/podcast";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/podcasts/$podcastSlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: PodcastInfoTab,
});

function PodcastInfoTab() {
  const {
    podcastSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={podcastWorkbench}
      slug={podcastSlug}
      infoTo="/taxonomies/podcasts/$podcastSlug/info"
      params={{
        podcastSlug,
      }}
      activeTab={tab}
    />
  );
}
