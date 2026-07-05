import type { YouTubeChannelCondition } from "@eesimple/types";

import { useTranslation } from "react-i18next";

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
    t,
  } = useTranslation();
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
        aria-label={t("YouTube Channels")}
        placeholder={isLoading ? t("Loading…") : t("Any channel")}
        searchPlaceholder={t("Search channels…")}
        emptyText={t("No channels found.")}
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
