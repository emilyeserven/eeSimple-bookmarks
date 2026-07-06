import { createFileRoute } from "@tanstack/react-router";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { mediaTypeWorkbench } from "../components/workbench/mediaType";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: MediaTypeInfoTab,
});

function MediaTypeInfoTab() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={mediaTypeWorkbench}
      slug={mediaTypeSlug}
      infoTo="/taxonomies/media-types/$mediaTypeSlug/info"
      params={{
        mediaTypeSlug,
      }}
      activeTab={tab}
    />
  );
}
