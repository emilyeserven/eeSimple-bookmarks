import { createFileRoute } from "@tanstack/react-router";

import { artistWorkbench } from "../components/workbench/artist";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/artists/$artistSlug/edit/image",
)({
  component: ImageEditTab,
});

function ImageEditTab() {
  const {
    artistSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={artistWorkbench}
      tabKey="image"
      mode="edit"
      slug={artistSlug}
    />
  );
}
