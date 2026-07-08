import type { Group, LabeledWebsite, SocialLink } from "@eesimple/types";

import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CreatorMediaSection } from "./CreatorMediaSection";
import { EntityImageField } from "./EntityImageField";
import { EntityNamesTabEditor } from "./entityNames/EntityNamesTab";
import { PrimaryLanguageField } from "./entityNames/PrimaryLanguageField";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { GroupImageActions } from "./GroupImageActions";
import { GroupYouTubeChannelsField } from "./GroupYouTubeChannelsField";
import { LabeledWebsitesField } from "./LabeledWebsitesField";
import { SocialLinksField } from "./SocialLinksField";
import { useGroupGeneralForm } from "./useGroupGeneralForm";
import {
  useDeleteGroupImage,
  useUpdateGroup,
  useUploadGroupImage,
} from "../hooks/useGroups";
import { usePrimaryLanguageField } from "../hooks/usePrimaryLanguageField";

import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { notifyFieldSaved } from "@/lib/autoSave";

/**
 * The placeable sub-fields of a group's General edit form (the group workbench registry uses each as a
 * `WorkbenchField.edit` renderer; `GroupGeneralForm` recomposes them into the same whole form the
 * Storybook story renders). Each owns its own `useGroupGeneralForm` slice — auto-save is per field, and
 * react-query dedupes the shared taxonomy queries. This mirrors `NewsletterGeneralForm.tsx` /
 * `CategoryGeneralForm.tsx` (the independent-slice split for slug-routed entities); no shared
 * form-context provider is needed because the only cross-field coupling — name → primary-language sync —
 * coordinates through the react-query-backed `usePrimaryLanguageField` cache.
 */

interface Props {
  group: Group;
}

/** Name field — auto-saves on blur, follows the new slug on rename, and re-syncs the primary-language name. */
export function GroupNameEditField({
  group,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    form, saveName,
  } = useGroupGeneralForm(group);
  const primaryLanguage = usePrimaryLanguageField("group", group.id);
  return (
    <form.AppField name="name">
      {field => (
        <field.TextField
          label={t("Name")}
          onBlur={() => {
            saveName(field.state.value, field.state.meta.errors.length === 0);
            primaryLanguage.syncPrimaryValue(field.state.value.trim());
          }}
        />
      )}
    </form.AppField>
  );
}

/** Description field — auto-saves on blur. */
export function GroupDescriptionEditField({
  group,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    form, saveField,
  } = useGroupGeneralForm(group);
  return (
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
  );
}

/**
 * Primary-language picker — a standalone placeable field. Mounts its own `usePrimaryLanguageField`
 * (react-query-backed, so it coordinates with the name field's sync via the shared cache) and seeds a
 * newly-set primary row with the group's saved name.
 */
export function GroupPrimaryLanguageEditField({
  group,
}: Props) {
  const primaryLanguage = usePrimaryLanguageField("group", group.id);
  return (
    <PrimaryLanguageField
      value={primaryLanguage.primaryLanguageId}
      onValueChange={v => primaryLanguage.setPrimaryLanguage(v, group.name)}
    />
  );
}

/** Additional-names editor — self-saving via `EntityNamesTabEditor`. */
export function GroupNamesEditField({
  group,
}: Props) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1">
      <Label>{t("Names")}</Label>
      <EntityNamesTabEditor
        ownerType="group"
        ownerId={group.id}
      />
    </div>
  );
}

/** Labeled-websites editor — auto-saves on change. */
export function GroupLabeledWebsitesEditField({
  group,
}: Props) {
  const {
    saveField,
  } = useGroupGeneralForm(group);
  return (
    <LabeledWebsitesField
      labeledWebsites={group.labeledWebsites}
      onChange={(websites: LabeledWebsite[]) => saveField("labeledWebsites", websites)}
    />
  );
}

/** Group-type combobox (with inline create) — auto-saves on change. */
export function GroupTypeEditField({
  group,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    form, saveField, groupTypeOptions, groupTypeCreate,
  } = useGroupGeneralForm(group);
  return (
    <>
      <form.AppField name="groupTypeId">
        {field => (
          <field.ComboboxField
            label={t("Group type")}
            placeholder={t("No group type")}
            searchPlaceholder={t("Search group types…")}
            emptyText={t("No group types found.")}
            options={groupTypeOptions}
            createOption={groupTypeCreate.createOption}
            onValueChange={value => saveField("groupTypeId", value || null)}
          />
        )}
      </form.AppField>
      {groupTypeCreate.modal}
    </>
  );
}

/** Connected-YouTube-channels multi-select — auto-saves on change. */
export function GroupConnectedYouTubeChannelsEditField({
  group,
}: Props) {
  const {
    saveField, youtubeChannels,
  } = useGroupGeneralForm(group);
  return (
    <GroupYouTubeChannelsField
      channels={youtubeChannels}
      selectedIds={group.youtubeChannelIds}
      onChange={ids => saveField("youtubeChannelIds", ids)}
    />
  );
}

/** Group image (avatar) upload/remove + fetch-from-source actions. Saves immediately. */
export function GroupImageEditField({
  group,
}: Props) {
  const {
    t,
  } = useTranslation();
  const uploadImage = useUploadGroupImage();
  const deleteImage = useDeleteGroupImage();
  const imageBusy = uploadImage.isPending || deleteImage.isPending;
  return (
    <div className="space-y-4">
      <EntityImageField
        label={t("Image")}
        imageUrl={group.imageUrl}
        fallback={<Building2 className="size-5" />}
        busy={imageBusy}
        onUpload={file => uploadImage.mutate({
          id: group.id,
          file,
        })}
        onRemove={() => deleteImage.mutate(group.id)}
      />
      <GroupImageActions group={group} />
    </div>
  );
}

/** Social-media links editor — auto-saves on change. */
export function GroupSocialLinksEditField({
  group,
}: Props) {
  const {
    saveField,
  } = useGroupGeneralForm(group);
  return (
    <SocialLinksField
      socialLinks={group.socialLinks}
      onChange={(links: SocialLink[]) => saveField("socialLinks", links)}
    />
  );
}

/** Year + Plex link (the shared creator/media composite). Saves immediately per field. */
export function GroupCreatorMediaEditField({
  group,
}: Props) {
  const updateGroup = useUpdateGroup();
  return (
    <CreatorMediaSection
      year={group.year}
      plexRatingKey={group.plexRatingKey}
      plexItemTitle={group.plexItemTitle}
      save={(input, label) => updateGroup.mutate(
        {
          id: group.id,
          input,
        },
        {
          onSuccess: () => notifyFieldSaved(label),
        },
      )}
    />
  );
}

/** Genres & moods assignment — self-saving. */
export function GroupGenreMoodEditField({
  group,
}: Props) {
  return (
    <GenreMoodAssignmentSection
      ownerType="group"
      ownerId={group.id}
    />
  );
}

/**
 * Edit a group's name, website, group type, image, and creator/media fields. Each field auto-saves (no
 * Save button). Composed from the same placeable sub-fields the group workbench registry uses, so this
 * whole-form shell (rendered by its Storybook story) stays in lockstep with the layout-driven General tab.
 */
export function GroupGeneralForm({
  group,
}: Props) {
  return (
    <div className="space-y-4">
      <GroupNameEditField group={group} />
      <GroupDescriptionEditField group={group} />
      <GroupPrimaryLanguageEditField group={group} />
      <GroupNamesEditField group={group} />
      <GroupLabeledWebsitesEditField group={group} />
      <GroupTypeEditField group={group} />
      <GroupConnectedYouTubeChannelsEditField group={group} />
      <GroupImageEditField group={group} />
      <Separator />
      <GroupSocialLinksEditField group={group} />
      <Separator />
      <GroupCreatorMediaEditField group={group} />
      <Separator />
      <GroupGenreMoodEditField group={group} />
    </div>
  );
}
