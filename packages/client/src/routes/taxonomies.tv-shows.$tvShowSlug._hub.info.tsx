import { createFileRoute } from "@tanstack/react-router";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { tvShowWorkbench } from "../components/workbench/tvShow";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/tv-shows/$tvShowSlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: TvShowInfoTab,
});

function TvShowInfoTab() {
  const {
    tvShowSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={tvShowWorkbench}
      slug={tvShowSlug}
      infoTo="/taxonomies/tv-shows/$tvShowSlug/info"
      params={{
        tvShowSlug,
      }}
      activeTab={tab}
    />
  );
}
