import { createFileRoute } from "@tanstack/react-router";

import { mediaTypeWorkbench } from "../components/workbench/mediaType";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/_view/general")({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={mediaTypeWorkbench}
      tabKey="general"
      mode="view"
      slug={mediaTypeSlug}
    />
  );
}
