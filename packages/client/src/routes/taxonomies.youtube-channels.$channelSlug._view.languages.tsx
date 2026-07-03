import { createFileRoute } from "@tanstack/react-router";

import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";
import { youtubeChannelWorkbench } from "../components/workbench/youtubeChannel";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/_view/languages")({
  component: LanguagesViewTab,
});

function LanguagesViewTab() {
  const {
    channelSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={youtubeChannelWorkbench}
      tabKey="languages"
      mode="view"
      slug={channelSlug}
    />
  );
}
