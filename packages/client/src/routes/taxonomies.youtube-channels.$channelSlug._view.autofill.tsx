import { createFileRoute } from "@tanstack/react-router";

import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";
import { youtubeChannelWorkbench } from "../components/workbench/youtubeChannel";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/_view/autofill")({
  component: AutofillViewTab,
});

function AutofillViewTab() {
  const {
    channelSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={youtubeChannelWorkbench}
      tabKey="autofill"
      mode="view"
      slug={channelSlug}
    />
  );
}
