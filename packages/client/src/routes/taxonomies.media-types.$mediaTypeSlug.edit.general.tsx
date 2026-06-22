import { createFileRoute } from "@tanstack/react-router";

import { mediaTypeWorkbench } from "../components/workbench/mediaType";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={mediaTypeWorkbench}
      tabKey="general"
      mode="edit"
      slug={mediaTypeSlug}
    />
  );
}
