import { createFileRoute } from "@tanstack/react-router";

import { authorWorkbench } from "../components/workbench/author";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/authors/$authorSlug/edit/youtube-channels")({
  component: YouTubeChannelsEditTab,
});

function YouTubeChannelsEditTab() {
  const {
    authorSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={authorWorkbench}
      tabKey="youtube-channels"
      mode="edit"
      slug={authorSlug}
    />
  );
}
