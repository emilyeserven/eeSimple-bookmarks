import type { YouTubeChannel } from "@eesimple/types";

import { useState } from "react";

import { channelUrlFromKey } from "@eesimple/types";
import { MonitorPlay } from "lucide-react";
import { z } from "zod";

import { DefaultTagsField } from "./DefaultTagsField";
import { EntityImageField } from "./EntityImageField";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCategories } from "@/hooks/useCategories";
import { useMediaTypes } from "@/hooks/useMediaTypes";
import { useTagTree } from "@/hooks/useTags";
import {
  useAutoYouTubeChannelImage,
  useDeleteYouTubeChannelImage,
  useUpdateYouTubeChannel,
  useUploadYouTubeChannelImage,
} from "@/hooks/useYouTubeChannels";
import { useAppForm } from "@/lib/form";
import { CategoryIcon } from "@/lib/icons";

const channelGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  categoryId: z.string().nullable(),
  mediaTypeId: z.string().nullable(),
});

interface Props {
  channel: YouTubeChannel;
}

/** Edit a YouTube channel's display name, category, and self-identifiers. */
export function YouTubeChannelGeneralForm({
  channel,
}: Props) {
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
    data: mediaTypes,
  } = useMediaTypes();
  const {
    data: tagTree,
  } = useTagTree();

  const form = useAppForm({
    defaultValues: {
      name: channel.name,
      categoryId: channel.category?.id ?? null,
      mediaTypeId: channel.mediaTypeId ?? null,
    },
    validators: {
      onChange: channelGeneralSchema,
    },
    onSubmit: ({
      value,
    }) => {
      updateChannel.mutate({
        id: channel.id,
        input: {
          name: value.name.trim(),
          selfIds,
          categoryId: value.categoryId || null,
          mediaTypeId: value.mediaTypeId || null,
          tagIds,
        },
      });
    },
  });

  function addSelfId(): void {
    const trimmed = newSelfId.trim();
    if (!trimmed || selfIds.includes(trimmed)) {
      setNewSelfId("");
      return;
    }
    setSelfIds(prev => [...prev, trimmed]);
    setNewSelfId("");
  }

  function removeSelfId(value: string): void {
    setSelfIds(prev => prev.filter(id => id !== value));
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="name">
        {field => (
          <field.TextField label="Channel name" />
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
            options={(categories ?? []).map(category => ({
              value: category.id,
              label: category.name,
              icon: (
                <CategoryIcon
                  name={category.icon}
                  className="size-4 shrink-0"
                />
              ),
            }))}
          />
        )}
      </form.AppField>

      <form.AppField name="mediaTypeId">
        {field => (
          <field.ComboboxField
            label="Media type"
            placeholder="No media type"
            searchPlaceholder="Search media types…"
            emptyText="No media types found."
            options={(mediaTypes ?? []).map(mediaType => ({
              value: mediaType.id,
              label: mediaType.name,
              icon: (
                <CategoryIcon
                  name={mediaType.icon}
                  className="size-4 shrink-0"
                />
              ),
            }))}
          />
        )}
      </form.AppField>
      <p className="text-sm text-muted-foreground">
        Media type applied automatically to bookmarks saved from this channel.
      </p>

      <Separator />

      <div className="space-y-2">
        <Label className="block">Self-identifiers</Label>
        <p className="text-sm text-muted-foreground">
          Short names this channel appends to video titles (e.g. &quot;SNL&quot;). Stripped automatically when a bookmark title is fetched.
        </p>
        {selfIds.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selfIds.map(id => (
              <Badge
                key={id}
                variant="secondary"
                className="cursor-pointer gap-1"
                onClick={() => removeSelfId(id)}
                title={`Remove "${id}"`}
              >
                {id}
                <span aria-hidden>×</span>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={newSelfId}
            onChange={e => setNewSelfId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSelfId();
              }
            }}
            placeholder="e.g. SNL"
            className="h-8 text-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addSelfId}
            disabled={!newSelfId.trim()}
          >
            Add
          </Button>
        </div>
      </div>

      <Separator />

      <DefaultTagsField
        tree={tagTree ?? []}
        selectedIds={tagIds}
        onToggle={id => setTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])}
        description="Tags applied automatically to bookmarks saved from this channel."
      />

      <form.AppForm>
        <form.Subscribe selector={state => state.values}>
          {(values) => {
            const nameDirty = values.name.trim() !== channel.name;
            const selfIdsDirty = JSON.stringify(selfIds) !== JSON.stringify(channel.selfIds);
            const categoryIdDirty = (values.categoryId || null) !== (channel.category?.id ?? null);
            const mediaTypeIdDirty = (values.mediaTypeId || null) !== (channel.mediaTypeId ?? null);
            const tagIdsDirty = JSON.stringify([...tagIds].sort()) !== JSON.stringify([...(channel.tagIds ?? [])].sort());
            return (
              <form.SubmitButton
                label="Save changes"
                size="sm"
                disabledWhen={!nameDirty && !selfIdsDirty && !categoryIdDirty && !mediaTypeIdDirty && !tagIdsDirty}
              />
            );
          }}
        </form.Subscribe>
      </form.AppForm>
    </form>
  );
}
