import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { Group } from "@eesimple/types";

import { useEntityCreateOption } from "./useEntityCreateOption";

interface BookmarkAdvancedGroupFieldProps {
  form: BookmarkFormApi;
  groups: Group[];
  /** Optional per-field auto-save hook (edit form); omitted on the create form. */
  onValueChange?: (id: string) => void;
}

/**
 * The Advanced section's Group control: a combobox with inline "Create group" and the
 * create modal.
 */
export function BookmarkAdvancedGroupField({
  form, groups, onValueChange,
}: BookmarkAdvancedGroupFieldProps) {
  const groupCreate = useEntityCreateOption("group", (group) => {
    form.setFieldValue("groupId", group.id);
    onValueChange?.(group.id);
  });

  return (
    <>
      <form.AppField name="groupId">
        {field => (
          <field.ComboboxField
            label="Group"
            placeholder="No group"
            searchPlaceholder="Search groups…"
            emptyText="No groups found."
            onValueChange={onValueChange}
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
