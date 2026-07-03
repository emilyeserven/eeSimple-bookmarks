import type { Group, SocialLink } from "@eesimple/types";

import { Building2 } from "lucide-react";

import { CreatorMediaSection } from "./CreatorMediaSection";
import { EntityImageField } from "./EntityImageField";
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
  const uploadImage = useUploadGroupImage();
  const deleteImage = useDeleteGroupImage();
  const imageBusy = uploadImage.isPending || deleteImage.isPending;

  return (
    <div className="space-y-4">
      <form.AppField name="name">
        {field => (
          <field.TextField
            label="Name"
            onBlur={() => saveName(field.state.value, field.state.meta.errors.length === 0)}
          />
        )}
      </form.AppField>

      <form.AppField name="romanizedName">
        {field => (
          <field.TextField
            label="Romanized name"
            placeholder="Optional romanized form"
            onBlur={() => saveField("romanizedName", field.state.value.trim())}
          />
        )}
      </form.AppField>

      <form.AppField name="websiteId">
        {field => (
          <field.ComboboxField
            label="Website"
            placeholder="No website"
            searchPlaceholder="Search websites…"
            emptyText="No websites found."
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
            label="Group type"
            placeholder="No group type"
            searchPlaceholder="Search group types…"
            emptyText="No group types found."
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
        label="Image"
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
