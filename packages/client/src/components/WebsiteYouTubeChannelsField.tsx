import type { YouTubeChannel } from "@eesimple/types";

import { useState } from "react";

import { AddYouTubeChannelModal } from "./AddYouTubeChannelModal";
import { MultiCombobox } from "./MultiCombobox";

import { Label } from "@/components/ui/label";

interface Props {
  channels: YouTubeChannel[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Multi-select field for associating YouTube channels with a website.
 * Saving happens immediately on each selection change.
 */
export function WebsiteYouTubeChannelsField({
  channels,
  selectedIds,
  onChange,
}: Props) {
  const [addChannelOpen, setAddChannelOpen] = useState(false);

  const options = channels.map(channel => ({
    value: channel.id,
    label: channel.name,
  }));

  return (
    <>
      <div className="space-y-2">
        <Label className="block">YouTube channels</Label>
        <p className="text-sm text-muted-foreground">
          YouTube channels associated with this website.
        </p>
        <MultiCombobox
          options={options}
          values={selectedIds}
          onValuesChange={onChange}
          placeholder="No channels selected"
          searchPlaceholder="Search channels…"
          emptyText="No channels found."
          createOption={{
            label: "Add channel",
            onSelect: () => setAddChannelOpen(true),
          }}
        />
      </div>
      <AddYouTubeChannelModal
        open={addChannelOpen}
        onOpenChange={setAddChannelOpen}
        onCreated={channel => onChange([...selectedIds, channel.id])}
      />
    </>
  );
}
