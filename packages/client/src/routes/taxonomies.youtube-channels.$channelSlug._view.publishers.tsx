import { createFileRoute } from "@tanstack/react-router";

import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";
import { youtubeChannelWorkbench } from "../components/workbench/youtubeChannel";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/_view/publishers")({
  component: PublishersViewTab,
});

function PublishersViewTab() {
  const {
    channelSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={youtubeChannelWorkbench}
      tabKey="publishers"
      mode="view"
      slug={channelSlug}
    />
  );
}
