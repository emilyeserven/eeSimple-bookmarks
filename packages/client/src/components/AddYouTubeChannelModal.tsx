import type { YouTubeChannel } from "@eesimple/types";

import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useCreateYouTubeChannel } from "../hooks/useYouTubeChannels";
import { useAppForm } from "../lib/form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const schema = z.object({
  channelUrl: z.string().trim().min(1, "Channel URL is required"),
  name: z.string().trim().min(1, "Name is required"),
});

interface AddYouTubeChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (channel: YouTubeChannel) => void;
}

export function AddYouTubeChannelModal({
  open,
  onOpenChange,
  onCreated,
}: AddYouTubeChannelModalProps) {
  const {
    t,
  } = useTranslation();
  const createChannel = useCreateYouTubeChannel();
  const form = useAppForm({
    defaultValues: {
      channelUrl: "",
      name: "",
    },
    validators: {
      onChange: schema,
    },
    onSubmit: ({
      value,
    }) => {
      createChannel.mutate(
        {
          channelUrl: value.channelUrl.trim(),
          name: value.name.trim(),
        },
        {
          onSuccess: (channel) => {
            onCreated?.(channel);
            onOpenChange(false);
            form.reset();
          },
        },
      );
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("New YouTube channel")}</DialogTitle>
          <DialogDescription>
            {t("Channels are normally created automatically when you add YouTube bookmarks — use this to add one by hand.")}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.AppField name="channelUrl">
            {field => (
              <field.TextField
                label={t("Channel URL")}
                placeholder="https://www.youtube.com/@channelname"
              />
            )}
          </form.AppField>
          <form.AppField name="name">
            {field => (
              <field.TextField
                label={t("Name")}
                placeholder="e.g. MKBHD"
              />
            )}
          </form.AppField>
          {createChannel.isError
            ? <p className="text-sm text-destructive">{createChannel.error.message}</p>
            : null}
          <DialogFooter>
            <form.AppForm>
              <form.SubmitButton
                label={t("Add channel")}
                pendingLabel={t("Adding…")}
              />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
