import { createFileRoute } from "@tanstack/react-router";

import { authorWorkbench } from "../components/workbench/author";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/authors/$authorSlug/_view/youtube-channels")({
  component: YouTubeChannelsViewTab,
});

function YouTubeChannelsViewTab() {
  const {
    authorSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={authorWorkbench}
      tabKey="youtube-channels"
      mode="view"
      slug={authorSlug}
    />
  );
}
