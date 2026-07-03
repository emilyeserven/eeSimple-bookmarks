import type { Group, SocialLink } from "@eesimple/types";

import { SocialLinksField } from "./SocialLinksField";
import { useGroupGeneralForm } from "./useGroupGeneralForm";

import { Separator } from "@/components/ui/separator";

interface Props {
  group: Group;
}

/** Edit a group's name and associated website. Fields auto-save individually (no Save button). */
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
  } = useGroupGeneralForm(group);

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

      <Separator />

      <SocialLinksField
        socialLinks={group.socialLinks}
        onChange={(links: SocialLink[]) => saveField("socialLinks", links)}
      />
    </div>
  );
}
