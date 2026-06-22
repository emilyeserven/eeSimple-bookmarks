/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { MonitorPlay } from "lucide-react";

import { WithPanelItem } from "./status";
import { useYouTubeChannels } from "../../../hooks/useYouTubeChannels";
import { YouTubeChannelCard } from "../../YouTubeChannelCard";
import { YouTubeChannelGeneralForm } from "../../YouTubeChannelGeneralForm";
import { PanelEntityEditor } from "../PanelEntityEditor";

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
  const query = useYouTubeChannels();
  return (
    <WithPanelItem
      queryResult={query}
      id={id}
      notFoundMessage="Channel not found."
    >
      {channel => <YouTubeChannelCard channel={channel} />}
    </WithPanelItem>
  );
}

/** Channel editor, reusing the same auto-save `YouTubeChannelGeneralForm` the edit tab renders. */
function YouTubeChannelEdit({
  id,
}: {
  id: string;
}) {
  const query = useYouTubeChannels();
  return (
    <WithPanelItem
      queryResult={query}
      id={id}
      notFoundMessage="Channel not found."
    >
      {channel => (
        <PanelEntityEditor name={channel.name}>
          <YouTubeChannelGeneralForm channel={channel} />
        </PanelEntityEditor>
      )}
    </WithPanelItem>
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
