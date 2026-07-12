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
import { CategoryDefaultField } from "./SourceDefaultFields";
import { useYouTubeChannelGeneralForm } from "./useYouTubeChannelGeneralForm";
import { useImageTaxonomySyncRegistration } from "../hooks/useImageTaxonomySyncRegistration";

import { Separator } from "@/components/ui/separator";

interface Props {
  channel: YouTubeChannel;
}

/**
 * The placeable sub-fields of a YouTube channel's General edit form (the channel workbench registry
 * uses each as a `WorkbenchField.edit` renderer; `YouTubeChannelGeneralForm` recomposes them into the
 * same whole form the Storybook story renders). Each independently calls `useYouTubeChannelGeneralForm`
 * and uses only its own slice — auto-save is per field, react-query dedupes the shared taxonomy queries,
 * so no form-context provider is needed (the Newsletter/Category precedent). The fields after `category`
 * carry a leading `<Separator/>` (the layout system only inserts separators between sections, so a
 * within-tab separator lives on the field it precedes).
 */

/** Channel name — auto-saves on blur and follows the new slug on rename. */
export function YouTubeChannelNameField({
  channel,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    form, saveName,
  } = useYouTubeChannelGeneralForm(channel);
  return (
    <form.AppField name="name">
      {field => (
        <field.TextField
          label={t("Channel name")}
          onBlur={() => saveName(field.state.value, field.state.meta.errors.length === 0)}
        />
      )}
    </form.AppField>
  );
}

/** Description — auto-saves on blur. */
export function YouTubeChannelDescriptionEdit({
  channel,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    form, saveField,
  } = useYouTubeChannelGeneralForm(channel);
  return (
    <form.AppField name="description">
      {field => (
        <field.TextareaField
          label={t("Description")}
          debounceSave
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
  );
}

/**
 * Avatar — upload / auto-fetch / remove. Also registers the header "Sync from source" button (avatar
 * preview + re-fetch); image sync is avatar-focused, so it follows this field if relocated via the
 * Page Layouts editor.
 */
export function YouTubeChannelAvatarField({
  channel,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    avatarBusy, uploadAvatar, autoAvatar, deleteAvatar,
  } = useYouTubeChannelGeneralForm(channel);

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
  );
}

/** Default category applied to bookmarks saved from this channel — auto-saves on change. */
export function YouTubeChannelCategoryEdit({
  channel,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    saveField, categoryOptions,
  } = useYouTubeChannelGeneralForm(channel);
  return (
    <>
      <CategoryDefaultField
        initialCategoryId={channel.category?.id ?? null}
        categoryOptions={categoryOptions}
        onCategoryChange={id => saveField("categoryId", id)}
      />
      <p className="text-sm text-muted-foreground">
        {t("Category applied automatically to bookmarks saved from this channel.")}
      </p>
    </>
  );
}

/** Self-identifiers — auto-saves on add/remove. Carries its leading separator. */
export function YouTubeChannelSelfIdsEdit({
  channel,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    selfIds, newSelfId, setNewSelfId, addSelfId, removeSelfId,
  } = useYouTubeChannelGeneralForm(channel);
  return (
    <>
      <Separator />
      <SelfIdsField
        selfIds={selfIds}
        newSelfId={newSelfId}
        onNewSelfIdChange={setNewSelfId}
        onAdd={addSelfId}
        onRemove={removeSelfId}
        description={t("Short names this channel appends to video titles (e.g. “SNL”). Stripped automatically when a bookmark title is fetched.")}
      />
    </>
  );
}

/** Default tags applied to bookmarks saved from this channel — auto-saves on toggle. Carries its leading separator. */
export function YouTubeChannelTagsEdit({
  channel,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    tagIds, toggleTag, tagTree,
  } = useYouTubeChannelGeneralForm(channel);
  return (
    <>
      <Separator />
      <DefaultTagsField
        tree={tagTree}
        selectedIds={tagIds}
        onToggle={toggleTag}
        description={t("Tags applied automatically to bookmarks saved from this channel.")}
      />
    </>
  );
}

/** Associated websites — auto-saves on change. Carries its leading separator. */
export function YouTubeChannelWebsitesEdit({
  channel,
}: Props) {
  const {
    saveField, websites,
  } = useYouTubeChannelGeneralForm(channel);
  return (
    <>
      <Separator />
      <ChannelWebsitesField
        websites={websites}
        selectedIds={channel.websiteIds ?? []}
        onChange={ids => saveField("websiteIds", ids)}
      />
    </>
  );
}

/** Groups — auto-saves on change. Carries its leading separator. */
export function YouTubeChannelGroupsEdit({
  channel,
}: Props) {
  const {
    saveField, groups,
  } = useYouTubeChannelGeneralForm(channel);
  return (
    <>
      <Separator />
      <ChannelGroupsField
        groups={groups}
        selectedIds={channel.groupIds ?? []}
        onChange={ids => saveField("groupIds", ids)}
      />
    </>
  );
}

/** Labeled websites — auto-saves on change. Carries its leading separator. */
export function YouTubeChannelLabeledWebsitesEdit({
  channel,
}: Props) {
  const {
    saveField,
  } = useYouTubeChannelGeneralForm(channel);
  return (
    <>
      <Separator />
      <LabeledWebsitesField
        labeledWebsites={channel.labeledWebsites}
        onChange={next => saveField("labeledWebsites", next)}
      />
    </>
  );
}

/** Genres & moods assignment — self-saving. Carries its leading separator. */
export function YouTubeChannelGenreMoodEdit({
  channel,
}: Props) {
  return (
    <>
      <Separator />
      <GenreMoodAssignmentSection
        ownerType="youtubeChannel"
        ownerId={channel.id}
      />
    </>
  );
}

/**
 * Edit a YouTube channel's display name, category, and self-identifiers. Each field auto-saves (no Save
 * button). Composed from the same placeable sub-fields the channel workbench registry uses, so this
 * whole-form shell (rendered by its Storybook story + test) stays in lockstep with the layout-driven
 * General tab.
 */
export function YouTubeChannelGeneralForm({
  channel,
}: Props) {
  return (
    <div className="space-y-4">
      <YouTubeChannelNameField channel={channel} />
      <YouTubeChannelDescriptionEdit channel={channel} />
      <YouTubeChannelAvatarField channel={channel} />
      <YouTubeChannelCategoryEdit channel={channel} />
      <YouTubeChannelSelfIdsEdit channel={channel} />
      <YouTubeChannelTagsEdit channel={channel} />
      <YouTubeChannelWebsitesEdit channel={channel} />
      <YouTubeChannelGroupsEdit channel={channel} />
      <YouTubeChannelLabeledWebsitesEdit channel={channel} />
      <YouTubeChannelGenreMoodEdit channel={channel} />
    </div>
  );
}
