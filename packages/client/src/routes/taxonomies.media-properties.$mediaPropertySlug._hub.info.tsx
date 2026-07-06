import { createFileRoute } from "@tanstack/react-router";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { mediaPropertyWorkbench } from "../components/workbench/mediaProperty";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/media-properties/$mediaPropertySlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: MediaPropertyInfoTab,
});

function MediaPropertyInfoTab() {
  const {
    mediaPropertySlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={mediaPropertyWorkbench}
      slug={mediaPropertySlug}
      infoTo="/taxonomies/media-properties/$mediaPropertySlug/info"
      params={{
        mediaPropertySlug,
      }}
      activeTab={tab}
    />
  );
}
