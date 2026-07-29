import type { YouTubeChannel } from "@eesimple/types";

import { useId, useState } from "react";

import { useTranslation } from "react-i18next";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateYouTubeChannel } from "../hooks/useYouTubeChannels";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddYouTubeChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (channel: YouTubeChannel) => void;
}

/**
 * Channel URL + name modal to create a YouTube channel by hand — a thin `InlineCreateModal`
 * wrapper using `nameLabel` for the channel-URL field and `extraFields` (+ `submitDisabledWhen`)
 * for the required channel name.
 */
export function AddYouTubeChannelModal({
  open,
  onOpenChange,
  onCreated,
}: AddYouTubeChannelModalProps) {
  const {
    t,
  } = useTranslation();
  const createChannel = useCreateYouTubeChannel();
  const [name, setName] = useState("");
  const nameId = useId();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("New YouTube channel")}
      description={t("Channels are normally created automatically when you add YouTube bookmarks — use this to add one by hand.")}
      placeholder="https://www.youtube.com/@channelname"
      nameLabel={t("Channel URL")}
      nameRequiredMessage="Channel URL is required"
      submitLabel={t("Add channel")}
      isError={createChannel.isError}
      errorMessage={createChannel.error?.message}
      submitDisabledWhen={name.trim() === ""}
      extraFields={(
        <div className="space-y-1">
          <Label htmlFor={nameId}>{t("Name")}</Label>
          <Input
            id={nameId}
            placeholder="e.g. MKBHD"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
      )}
      onSubmit={(channelUrl, done) => {
        createChannel.mutate(
          {
            channelUrl,
            name: name.trim(),
          },
          {
            onSuccess: (channel) => {
              onCreated?.(channel);
              setName("");
              done();
            },
          },
        );
      }}
    />
  );
}
