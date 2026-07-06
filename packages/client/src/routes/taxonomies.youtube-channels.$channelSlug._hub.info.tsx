import { createFileRoute } from "@tanstack/react-router";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { youtubeChannelWorkbench } from "../components/workbench/youtubeChannel";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: YouTubeChannelInfoTab,
});

function YouTubeChannelInfoTab() {
  const {
    channelSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={youtubeChannelWorkbench}
      slug={channelSlug}
      infoTo="/taxonomies/youtube-channels/$channelSlug/info"
      params={{
        channelSlug,
      }}
      activeTab={tab}
    />
  );
}
