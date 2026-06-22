import { createFileRoute } from "@tanstack/react-router";

import { mediaTypeWorkbench } from "../components/workbench/mediaType";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/_view/autofill")({
  component: AutofillViewTab,
});

function AutofillViewTab() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={mediaTypeWorkbench}
      tabKey="autofill"
      mode="view"
      slug={mediaTypeSlug}
    />
  );
}
