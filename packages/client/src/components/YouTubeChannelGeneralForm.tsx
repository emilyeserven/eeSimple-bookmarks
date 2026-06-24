import type { UpdateYouTubeChannelInput, YouTubeChannel } from "@eesimple/types";

import { useState } from "react";

import { channelUrlFromKey } from "@eesimple/types";
import { useNavigate } from "@tanstack/react-router";
import { MonitorPlay } from "lucide-react";
import { z } from "zod";

import { AddCategoryModal } from "./AddCategoryModal";
import { AddMediaTypeModal } from "./AddMediaTypeModal";
import { ChannelWebsitesField } from "./ChannelWebsitesField";
import { DefaultTagsField } from "./DefaultTagsField";
import { EntityImageField } from "./EntityImageField";
import { SelfIdsField } from "./SelfIdsField";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";

import { Separator } from "@/components/ui/separator";
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
  categoryId: z.string().nullable(),
  mediaTypeId: z.string().nullable(),
});

const LABELS: Partial<Record<keyof UpdateYouTubeChannelInput, string>> = {
  name: "Name",
  selfIds: "Self-identifiers",
  categoryId: "Category",
  mediaTypeId: "Media type",
  tagIds: "Default tags",
  websiteIds: "Websites",
};

interface Props {
  channel: YouTubeChannel;
}

/** Edit a YouTube channel's display name, category, and self-identifiers. Each field auto-saves (no Save button). */
export function YouTubeChannelGeneralForm({
  channel,
}: Props) {
  const navigate = useNavigate();
  const updateChannel = useUpdateYouTubeChannel();
  const uploadAvatar = useUploadYouTubeChannelImage();
  const autoAvatar = useAutoYouTubeChannelImage();
  const deleteAvatar = useDeleteYouTubeChannelImage();
  const avatarBusy = uploadAvatar.isPending || autoAvatar.isPending || deleteAvatar.isPending;
  const [selfIds, setSelfIds] = useState<string[]>(channel.selfIds);
  const [newSelfId, setNewSelfId] = useState("");
  const [tagIds, setTagIds] = useState<string[]>(channel.tagIds ?? []);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addMediaTypeOpen, setAddMediaTypeOpen] = useState(false);
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
    initial: {
      name: channel.name,
      selfIds: channel.selfIds,
      categoryId: channel.category?.id ?? null,
      mediaTypeId: channel.mediaTypeId ?? null,
      tagIds: channel.tagIds ?? [],
      websiteIds: channel.websiteIds ?? [],
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: channel.name,
      categoryId: channel.category?.id ?? null,
      mediaTypeId: channel.mediaTypeId ?? null,
    },
    validators: {
      onChange: channelGeneralSchema,
    },
  });

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

  return (
    <div className="space-y-4">
      <form.AppField name="name">
        {field => (
          <field.TextField
            label="Channel name"
            onBlur={() => autoSave.saveField(
              "name",
              field.state.value.trim(),
              {
                valid: field.state.meta.errors.length === 0,
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
              },
            )}
          />
        )}
      </form.AppField>

      <EntityImageField
        label="Avatar"
        imageUrl={channel.imageUrl}
        shape="circle"
        fallback={<MonitorPlay className="size-5" />}
        busy={avatarBusy}
        onUpload={file => uploadAvatar.mutate({
          id: channel.id,
          file,
        })}
        onAuto={() => autoAvatar.mutate({
          id: channel.id,
          sourceUrl: channelUrlFromKey(channel.channelKey),
        })}
        autoLabel="Fetch avatar"
        onRemove={() => deleteAvatar.mutate(channel.id)}
      />

      <form.AppField name="categoryId">
        {field => (
          <field.ComboboxField
            label="Category"
            placeholder="No category"
            searchPlaceholder="Search categories…"
            emptyText="No categories found."
            options={iconComboboxOptions(categories ?? [])}
            createOption={{
              label: "Create category",
              onSelect: () => setAddCategoryOpen(true),
            }}
            onValueChange={value => autoSave.saveField("categoryId", value || null)}
          />
        )}
      </form.AppField>
      <AddCategoryModal
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onCreated={category => form.setFieldValue("categoryId", category.id)}
      />

      <form.AppField name="mediaTypeId">
        {field => (
          <field.ComboboxField
            label="Media type"
            placeholder="No media type"
            searchPlaceholder="Search media types…"
            emptyText="No media types found."
            options={mediaTypeTreeComboboxOptions(mediaTypeTree ?? [])}
            createOption={{
              label: "Create media type",
              onSelect: () => setAddMediaTypeOpen(true),
            }}
            onValueChange={value => autoSave.saveField("mediaTypeId", value || null)}
          />
        )}
      </form.AppField>
      <AddMediaTypeModal
        open={addMediaTypeOpen}
        onOpenChange={setAddMediaTypeOpen}
        onCreated={mediaType => form.setFieldValue("mediaTypeId", mediaType.id)}
      />
      <p className="text-sm text-muted-foreground">
        Media type applied automatically to bookmarks saved from this channel.
      </p>

      <Separator />

      <SelfIdsField
        selfIds={selfIds}
        newSelfId={newSelfId}
        onNewSelfIdChange={setNewSelfId}
        onAdd={addSelfId}
        onRemove={removeSelfId}
        description="Short names this channel appends to video titles (e.g. “SNL”). Stripped automatically when a bookmark title is fetched."
      />

      <Separator />

      <DefaultTagsField
        tree={tagTree ?? []}
        selectedIds={tagIds}
        onToggle={id => saveTagIds(tagIds.includes(id) ? tagIds.filter(t => t !== id) : [...tagIds, id])}
        description="Tags applied automatically to bookmarks saved from this channel."
      />

      <Separator />

      <ChannelWebsitesField
        websites={websites ?? []}
        selectedIds={channel.websiteIds ?? []}
        onChange={ids => autoSave.saveField("websiteIds", ids)}
      />
    </div>
  );
}
