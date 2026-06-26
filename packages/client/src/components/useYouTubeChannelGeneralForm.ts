import type { UpdateYouTubeChannelInput, YouTubeChannel } from "@eesimple/types";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";

import { useCategories } from "@/hooks/useCategories";
import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { useTagTree } from "@/hooks/useTags";
import { useWebsites } from "@/hooks/useWebsites";
import {
  useAutoYouTubeChannelImage,
  useDeleteYouTubeChannelImage,
  useUpdateYouTubeChannel,
  useUploadYouTubeChannelImage,
} from "@/hooks/useYouTubeChannels";
import { iconComboboxOptions, mediaTypeTreeComboboxOptions } from "@/lib/comboboxOptions";
import { useAppForm } from "@/lib/form";

const channelGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

const LABELS: Partial<Record<keyof UpdateYouTubeChannelInput, string>> = {
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

/**
 * Owns every stateful piece of the YouTube-channel General (edit) form: the avatar mutations, the
 * local self-id + tag state, the taxonomy queries (returned with defaults applied), the autosave
 * engine, and the field-save handlers. Returns one bag so `YouTubeChannelGeneralForm` stays a
 * presentational shell, mirroring `useWebsiteGeneralForm`.
 */
export function useYouTubeChannelGeneralForm(channel: YouTubeChannel) {
  const navigate = useNavigate();
  const updateChannel = useUpdateYouTubeChannel();
  const uploadAvatar = useUploadYouTubeChannelImage();
  const autoAvatar = useAutoYouTubeChannelImage();
  const deleteAvatar = useDeleteYouTubeChannelImage();
  const avatarBusy = uploadAvatar.isPending || autoAvatar.isPending || deleteAvatar.isPending;
  const [selfIds, setSelfIds] = useState<string[]>(channel.selfIds);
  const [newSelfId, setNewSelfId] = useState("");
  const [tagIds, setTagIds] = useState<string[]>(channel.tagIds ?? []);
  const {
    data: categories,
  } = useCategories();
  const {
    data: mediaTypeTree,
  } = useMediaTypeTree();
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: websites,
  } = useWebsites();

  const autoSave = useFieldAutoSave<UpdateYouTubeChannelInput, YouTubeChannel>({
    id: channel.id,
    update: updateChannel,
    labels: LABELS,
    initial: channelAutoSaveInitial(channel),
  });

  const form = useAppForm({
    defaultValues: {
      name: channel.name,
    },
    validators: {
      onChange: channelGeneralSchema,
    },
  });

  function saveName(value: string, valid: boolean): void {
    autoSave.saveField("name", value.trim(), {
      valid,
      // Renaming changes the slug; follow it so the edit page keeps resolving.
      onSuccess: (updated) => {
        if (updated.slug && updated.slug !== channel.slug) {
          void navigate({
            to: "/taxonomies/youtube-channels/$channelSlug/edit/general",
            params: {
              channelSlug: updated.slug,
            },
          });
        }
      },
    });
  }

  function saveSelfIds(next: string[]): void {
    setSelfIds(next);
    autoSave.saveField("selfIds", next);
  }

  function addSelfId(): void {
    const trimmed = newSelfId.trim();
    if (!trimmed || selfIds.includes(trimmed)) {
      setNewSelfId("");
      return;
    }
    saveSelfIds([...selfIds, trimmed]);
    setNewSelfId("");
  }

  function removeSelfId(value: string): void {
    saveSelfIds(selfIds.filter(id => id !== value));
  }

  function saveTagIds(next: string[]): void {
    setTagIds(next);
    autoSave.saveField("tagIds", next);
  }

  function toggleTag(id: string): void {
    saveTagIds(tagIds.includes(id) ? tagIds.filter(t => t !== id) : [...tagIds, id]);
  }

  return {
    form,
    avatarBusy,
    selfIds,
    newSelfId,
    setNewSelfId,
    tagIds,
    saveField: autoSave.saveField,
    saveName,
    addSelfId,
    removeSelfId,
    toggleTag,
    uploadAvatar,
    autoAvatar,
    deleteAvatar,
    categoryOptions: iconComboboxOptions(categories ?? []),
    mediaTypeOptions: mediaTypeTreeComboboxOptions(mediaTypeTree ?? []),
    tagTree: tagTree ?? [],
    websites: websites ?? [],
  };
}
