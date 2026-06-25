import { createFileRoute } from "@tanstack/react-router";

import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";
import { youtubeChannelWorkbench } from "../components/workbench/youtubeChannel";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/_view/display-rules")({
  component: DisplayRulesViewTab,
});

function DisplayRulesViewTab() {
  const {
    channelSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={youtubeChannelWorkbench}
      tabKey="display-rules"
      mode="view"
      slug={channelSlug}
    />
  );
}
