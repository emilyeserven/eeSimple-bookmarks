import { createFileRoute } from "@tanstack/react-router";

import { albumWorkbench } from "../components/workbench/album";
import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/albums/$albumSlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: AlbumInfoTab,
});

function AlbumInfoTab() {
  const {
    albumSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={albumWorkbench}
      slug={albumSlug}
      infoTo="/taxonomies/albums/$albumSlug/info"
      params={{
        albumSlug,
      }}
      activeTab={tab}
    />
  );
}
