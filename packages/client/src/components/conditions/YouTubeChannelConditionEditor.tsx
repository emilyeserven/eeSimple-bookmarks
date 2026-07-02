import type { YouTubeChannelCondition } from "@eesimple/types";

import { MultiCombobox } from "../MultiCombobox";
import { useEntityCreateOption } from "../useEntityCreateOption";

import { useYouTubeChannels } from "@/hooks/useYouTubeChannels";

interface YouTubeChannelConditionEditorProps {
  value: YouTubeChannelCondition;
  onChange: (next: YouTubeChannelCondition) => void;
}

/** Controlled multi-select editor for a "YouTube channel is one of …" condition. */
export function YouTubeChannelConditionEditor({
  value, onChange,
}: YouTubeChannelConditionEditorProps) {
  const {
    data: channels = [], isLoading,
  } = useYouTubeChannels();
  const channelCreate = useEntityCreateOption("youtube-channel", channel =>
    onChange({
      ...value,
      channelIds: [...value.channelIds, channel.id],
    }));

  return (
    <>
      <MultiCombobox
        aria-label="YouTube Channels"
        placeholder={isLoading ? "Loading…" : "Any channel"}
        searchPlaceholder="Search channels…"
        emptyText="No channels found."
        options={channels.map(channel => ({
          value: channel.id,
          label: channel.name,
        }))}
        values={value.channelIds}
        onValuesChange={channelIds =>
          onChange({
            ...value,
            channelIds,
          })}
        createOption={channelCreate.createOption}
      />
      {channelCreate.modal}
    </>
  );
}
