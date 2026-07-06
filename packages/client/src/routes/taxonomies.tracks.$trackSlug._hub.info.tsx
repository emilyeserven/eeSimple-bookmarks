import { createFileRoute } from "@tanstack/react-router";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { trackWorkbench } from "../components/workbench/track";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/tracks/$trackSlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: TrackInfoTab,
});

function TrackInfoTab() {
  const {
    trackSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={trackWorkbench}
      slug={trackSlug}
      infoTo="/taxonomies/tracks/$trackSlug/info"
      params={{
        trackSlug,
      }}
      activeTab={tab}
    />
  );
}
