/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { MonitorPlay } from "lucide-react";

import { useYouTubeChannels } from "../../../hooks/useYouTubeChannels";
import { youtubeChannelWorkbench } from "../../workbench/youtubeChannel";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useYouTubeChannelList() {
  const {
    data, isLoading, error,
  } = useYouTubeChannels();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(channel => ({
      id: channel.id,
      label: channel.name,
      sublabel: channel.channelKey,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only channel view — the same tabbed bodies + shell the main-app channel pages render. */
function YouTubeChannelView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={youtubeChannelWorkbench}
      id={id}
      mode="view"
      contentType="youtube-channel"
    />
  );
}

/** Channel editor — the same per-tab auto-save forms the main-app edit tabs render. */
function YouTubeChannelEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={youtubeChannelWorkbench}
      id={id}
      mode="edit"
      contentType="youtube-channel"
    />
  );
}

export const youtubeChannelContentType: PanelContentTypeDef = {
  type: "youtube-channel",
  label: "YouTube Channels",
  singular: "YouTube Channel",
  icon: MonitorPlay,
  useList: useYouTubeChannelList,
  View: YouTubeChannelView,
  Edit: YouTubeChannelEdit,
};
