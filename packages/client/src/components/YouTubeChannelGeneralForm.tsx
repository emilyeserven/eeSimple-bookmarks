import type { YouTubeChannel } from "@eesimple/types";

import { channelUrlFromKey } from "@eesimple/types";
import { MonitorPlay } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ChannelGroupsField } from "./ChannelGroupsField";
import { ChannelWebsitesField } from "./ChannelWebsitesField";
import { DefaultTagsField } from "./DefaultTagsField";
import { EntityImageField } from "./EntityImageField";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { LabeledWebsitesField } from "./LabeledWebsitesField";
import { SelfIdsField } from "./SelfIdsField";
import { SourceDefaultFields } from "./SourceDefaultFields";
import { useYouTubeChannelGeneralForm } from "./useYouTubeChannelGeneralForm";
import { useImageTaxonomySyncRegistration } from "../hooks/useImageTaxonomySyncRegistration";

import { Separator } from "@/components/ui/separator";

interface Props {
  channel: YouTubeChannel;
}

/** Edit a YouTube channel's display name, category, and self-identifiers. Each field auto-saves (no Save button). */
export function YouTubeChannelGeneralForm({
  channel,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    form, avatarBusy, selfIds, newSelfId, setNewSelfId, tagIds,
    saveField, saveName, addSelfId, removeSelfId, toggleTag,
    uploadAvatar, autoAvatar, deleteAvatar, categoryOptions, tagTree, websites, groups,
  } = useYouTubeChannelGeneralForm(channel);

  // Register the header "Sync from source" button (preview + re-fetch the channel avatar).
  useImageTaxonomySyncRegistration({
    entityId: channel.id,
    entityLabel: channel.name,
    sourceLabel: "YouTube",
    previewKind: "youtube",
    currentImageUrl: channel.imageUrl ?? null,
    applyImage: () => autoAvatar.mutate({
      id: channel.id,
      sourceUrl: channelUrlFromKey(channel.channelKey),
    }),
  });

  return (
    <div className="space-y-4">
      <form.AppField name="name">
        {field => (
          <field.TextField
            label={t("Channel name")}
            onBlur={() => saveName(field.state.value, field.state.meta.errors.length === 0)}
          />
        )}
      </form.AppField>

      <form.AppField name="description">
        {field => (
          <field.TextareaField
            label={t("Description")}
            onBlur={() => saveField(
              "description",
              field.state.value.trim() || null,
              {
                valid: field.state.meta.errors.length === 0,
              },
            )}
          />
        )}
      </form.AppField>

      <EntityImageField
        label={t("Avatar")}
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
        autoLabel={t("Fetch avatar")}
        onRemove={() => deleteAvatar.mutate(channel.id)}
      />

      <SourceDefaultFields
        initialCategoryId={channel.category?.id ?? null}
        categoryOptions={categoryOptions}
        onCategoryChange={id => saveField("categoryId", id)}
        showMediaType={false}
        note={t("Category applied automatically to bookmarks saved from this channel.")}
      />

      <Separator />

      <SelfIdsField
        selfIds={selfIds}
        newSelfId={newSelfId}
        onNewSelfIdChange={setNewSelfId}
        onAdd={addSelfId}
        onRemove={removeSelfId}
        description={t("Short names this channel appends to video titles (e.g. “SNL”). Stripped automatically when a bookmark title is fetched.")}
      />

      <Separator />

      <DefaultTagsField
        tree={tagTree}
        selectedIds={tagIds}
        onToggle={toggleTag}
        description={t("Tags applied automatically to bookmarks saved from this channel.")}
        categoryId={channel.category?.id ?? null}
      />

      <Separator />

      <ChannelWebsitesField
        websites={websites}
        selectedIds={channel.websiteIds ?? []}
        onChange={ids => saveField("websiteIds", ids)}
      />

      <Separator />

      <ChannelGroupsField
        groups={groups}
        selectedIds={channel.groupIds ?? []}
        onChange={ids => saveField("groupIds", ids)}
      />

      <Separator />

      <LabeledWebsitesField
        labeledWebsites={channel.labeledWebsites}
        onChange={next => saveField("labeledWebsites", next)}
      />

      <Separator />

      <GenreMoodAssignmentSection
        ownerType="youtubeChannel"
        ownerId={channel.id}
      />
    </div>
  );
}
