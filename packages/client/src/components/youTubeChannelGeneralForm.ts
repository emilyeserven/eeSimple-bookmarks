import type { UpdateYouTubeChannelInput, YouTubeChannel } from "@eesimple/types";

import { z } from "zod";

export const channelGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export const CHANNEL_LABELS: Partial<Record<keyof UpdateYouTubeChannelInput, string>> = {
  name: "Name",
  selfIds: "Self-identifiers",
  categoryId: "Category",
  mediaTypeId: "Media type",
  tagIds: "Default tags",
  websiteIds: "Websites",
};

/** The autosave snapshot for a channel's editable fields, with nullable defaults applied. */
export function channelAutoSaveInitial(channel: YouTubeChannel): UpdateYouTubeChannelInput {
  return {
    name: channel.name,
    selfIds: channel.selfIds,
    categoryId: channel.category?.id ?? null,
    mediaTypeId: channel.mediaTypeId ?? null,
    tagIds: channel.tagIds ?? [],
    websiteIds: channel.websiteIds ?? [],
  };
}
