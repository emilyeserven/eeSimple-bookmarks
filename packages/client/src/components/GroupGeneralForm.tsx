import type { Group, SocialLink } from "@eesimple/types";

import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CreatorMediaSection } from "./CreatorMediaSection";
import { EntityImageField } from "./EntityImageField";
import { EntityNamesTabEditor } from "./entityNames/EntityNamesTab";
import { PrimaryLanguageField } from "./entityNames/PrimaryLanguageField";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { GroupImageActions } from "./GroupImageActions";
import { GroupYouTubeChannelsField } from "./GroupYouTubeChannelsField";
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

interface Props {
  group: Group;
}

/** Edit a group's name, website, group type, image, and creator/media fields. Fields auto-save. */
export function GroupGeneralForm({
  group,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    form,
    saveField,
    saveName,
    websiteOptions,
    websiteCreate,
    groupTypeOptions,
    groupTypeCreate,
    youtubeChannels,
  } = useGroupGeneralForm(group);
  const updateGroup = useUpdateGroup();
  const primaryLanguage = usePrimaryLanguageField("group", group.id);
  const uploadImage = useUploadGroupImage();
  const deleteImage = useDeleteGroupImage();
  const imageBusy = uploadImage.isPending || deleteImage.isPending;

  return (
    <div className="space-y-4">
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

      <PrimaryLanguageField
        value={primaryLanguage.primaryLanguageId}
        onValueChange={v => primaryLanguage.setPrimaryLanguage(v, form.state.values.name)}
      />

      <div className="space-y-1">
        <Label>{t("Names")}</Label>
        <EntityNamesTabEditor
          ownerType="group"
          ownerId={group.id}
        />
      </div>

      <form.AppField name="websiteId">
        {field => (
          <field.ComboboxField
            label={t("Website")}
            placeholder={t("No website")}
            searchPlaceholder={t("Search websites…")}
            emptyText={t("No websites found.")}
            options={websiteOptions}
            createOption={websiteCreate.createOption}
            onValueChange={value => saveField("websiteId", value || null)}
          />
        )}
      </form.AppField>
      {websiteCreate.modal}

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

      <GroupYouTubeChannelsField
        channels={youtubeChannels}
        selectedIds={group.youtubeChannelIds}
        onChange={ids => saveField("youtubeChannelIds", ids)}
      />

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

      <Separator />

      <SocialLinksField
        socialLinks={group.socialLinks}
        onChange={(links: SocialLink[]) => saveField("socialLinks", links)}
      />

      <Separator />

      <CreatorMediaSection
        year={group.year}
        plexRatingKey={group.plexRatingKey}
        plexItemTitle={group.plexItemTitle}
        albumIds={group.albumIds}
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

      <Separator />

      <GenreMoodAssignmentSection
        ownerType="group"
        ownerId={group.id}
      />
    </div>
  );
}
