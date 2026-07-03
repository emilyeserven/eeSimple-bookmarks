import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { Group } from "@eesimple/types";

import { useEntityCreateOption } from "./useEntityCreateOption";

interface BookmarkAdvancedGroupFieldProps {
  form: BookmarkFormApi;
  groups: Group[];
}

/**
 * The Advanced section's Group control: a combobox with inline "Create group" and the
 * create modal.
 */
export function BookmarkAdvancedGroupField({
  form, groups,
}: BookmarkAdvancedGroupFieldProps) {
  const groupCreate = useEntityCreateOption("group", group => form.setFieldValue("groupId", group.id));

  return (
    <>
      <form.AppField name="groupId">
        {field => (
          <field.ComboboxField
            label="Group"
            placeholder="No group"
            searchPlaceholder="Search groups…"
            emptyText="No groups found."
            createOption={groupCreate.createOption}
            options={groups.map(p => ({
              value: p.id,
              label: p.name,
            }))}
          />
        )}
      </form.AppField>
      {groupCreate.modal}
    </>
  );
}
