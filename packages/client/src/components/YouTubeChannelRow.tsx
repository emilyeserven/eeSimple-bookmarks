import type { YouTubeChannel } from "@eesimple/types";

import { useState } from "react";

import { ChannelDetailsList } from "./ChannelDetailsList";
import { LabeledSection } from "./LabeledSection";
import { useUpdateYouTubeChannel } from "../hooks/useYouTubeChannels";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/** A single editable channel row: rename only — the channel key is fixed and auto-assigned. */
export function YouTubeChannelRow({
  channel,
  onSaved,
}: { channel: YouTubeChannel;
  onSaved?: () => void; }) {
  const updateChannel = useUpdateYouTubeChannel();
  const [name, setName] = useState(channel.name);

  const dirty = name.trim() !== channel.name;
  const valid = name.trim().length > 0;

  function save(): void {
    if (!dirty || !valid) return;
    updateChannel.mutate(
      {
        id: channel.id,
        input: {
          name: name.trim(),
        },
      },
      {
        onSuccess: () => onSaved?.(),
      },
    );
  }

  return (
    <div className="space-y-6">
      <LabeledSection title="Channel name">
        <div
          className="
            grid gap-3
            sm:grid-cols-[1fr_auto] sm:items-end
          "
        >
          <div className="space-y-1">
            <Label htmlFor={`channel-name-${channel.id}`}>Channel name</Label>
            <Input
              id={`channel-name-${channel.id}`}
              value={name}
              onChange={event => setName(event.target.value)}
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!dirty || !valid || updateChannel.isPending}
            onClick={save}
          >
            {updateChannel.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
        {updateChannel.isError
          ? <p className="mt-2 text-sm text-destructive">{updateChannel.error.message}</p>
          : null}
      </LabeledSection>

      <Separator />

      <LabeledSection
        title="Details"
        description="Assigned automatically — not editable."
      >
        <ChannelDetailsList channel={channel} />
      </LabeledSection>
    </div>
  );
}
