import type { YouTubeChannel } from "@eesimple/types";

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
  const options = channels.map(channel => ({
    value: channel.id,
    label: channel.name,
  }));

  function handleValuesChange(next: string[]) {
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <Label className="block">YouTube channels</Label>
      <p className="text-sm text-muted-foreground">
        YouTube channels associated with this website.
      </p>
      <MultiCombobox
        options={options}
        values={selectedIds}
        onValuesChange={handleValuesChange}
        placeholder="No channels selected"
        searchPlaceholder="Search channels…"
        emptyText="No channels found."
      />
    </div>
  );
}
