/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { MonitorPlay } from "lucide-react";

import { Loading, Problem } from "./status";
import { useYouTubeChannels } from "../../../hooks/useYouTubeChannels";
import { YouTubeChannelCard } from "../../YouTubeChannelCard";
import { YouTubeChannelRow } from "../../YouTubeChannelRow";

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

/** Read-only channel view, reusing the same `YouTubeChannelCard` the view page renders. */
function YouTubeChannelView({
  id,
}: {
  id: string;
}) {
  const {
    data, isLoading, error,
  } = useYouTubeChannels();
  if (isLoading) return <Loading />;
  if (error) return <Problem>{error.message}</Problem>;
  const channel = (data ?? []).find(item => item.id === id);
  if (!channel) return <Problem>Channel not found.</Problem>;
  return <YouTubeChannelCard channel={channel} />;
}

/** Inline channel editor, reusing the same `YouTubeChannelRow` the settings and edit pages use. */
function YouTubeChannelEdit({
  id,
}: {
  id: string;
}) {
  const {
    data, isLoading, error,
  } = useYouTubeChannels();
  if (isLoading) return <Loading />;
  if (error) return <Problem>{error.message}</Problem>;
  const channel = (data ?? []).find(item => item.id === id);
  if (!channel) return <Problem>Channel not found.</Problem>;
  return <YouTubeChannelRow channel={channel} />;
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
