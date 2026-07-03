import type { YouTubeChannel } from "@eesimple/types";

import { MultiCombobox } from "./MultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";

import { Label } from "@/components/ui/label";

interface Props {
  channels: YouTubeChannel[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Multi-select field for associating YouTube channels with a group — the mirror of
 * `ChannelGroupsField`. Saving happens immediately on each selection change.
 */
export function GroupYouTubeChannelsField({
  channels,
  selectedIds,
  onChange,
}: Props) {
  const channelCreate = useEntityCreateOption("youtube-channel", channel => onChange([...selectedIds, channel.id]));

  const options = channels.map(channel => ({
    value: channel.id,
    label: channel.name,
  }));

  return (
    <>
      <div className="space-y-2">
        <Label className="block">YouTube channels</Label>
        <p className="text-sm text-muted-foreground">
          YouTube channels associated with this group.
        </p>
        <MultiCombobox
          options={options}
          values={selectedIds}
          onValuesChange={onChange}
          placeholder="No channels selected"
          searchPlaceholder="Search channels…"
          emptyText="No channels found."
          createOption={channelCreate.createOption}
        />
      </div>
      {channelCreate.modal}
    </>
  );
}
