import type { UpdateYouTubeChannelInput, YouTubeChannel } from "@eesimple/types";

import { z } from "zod";

import i18n from "@/i18n";

export const channelGeneralSchema = z.object({
  name: z.string().trim().min(1, i18n.t("Name is required")),
  description: z.string(),
});

export const CHANNEL_LABELS: Partial<Record<keyof UpdateYouTubeChannelInput, string>> = {
  name: "Name",
  description: "Description",
  selfIds: "Self-identifiers",
  categoryId: "Category",
  tagIds: "Default tags",
  websiteIds: "Websites",
  groupIds: "Groups",
};

/** The autosave snapshot for a channel's editable fields, with nullable defaults applied. */
export function channelAutoSaveInitial(channel: YouTubeChannel): UpdateYouTubeChannelInput {
  return {
    name: channel.name,
    description: channel.description ?? null,
    selfIds: channel.selfIds,
    categoryId: channel.category?.id ?? null,
    tagIds: channel.tagIds ?? [],
    websiteIds: channel.websiteIds ?? [],
    groupIds: channel.groupIds ?? [],
  };
}
