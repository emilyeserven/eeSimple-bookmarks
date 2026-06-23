import type { YouTubeChannelCondition } from "@eesimple/types";

import { useState } from "react";

import { AddYouTubeChannelModal } from "../AddYouTubeChannelModal";
import { MultiCombobox } from "../MultiCombobox";

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
  const [addOpen, setAddOpen] = useState(false);

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
        createOption={{
          label: "Create channel",
          onSelect: () => setAddOpen(true),
        }}
      />
      <AddYouTubeChannelModal
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </>
  );
}
