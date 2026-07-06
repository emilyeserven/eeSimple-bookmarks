import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { Group } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { MultiCombobox } from "./MultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";

import { Label } from "@/components/ui/label";

interface BookmarkGroupsFieldProps {
  form: BookmarkFormApi;
  groups: Group[];
}

/**
 * The Groups (creators) multi-combobox with inline "Create group" and its create modal — the plural
 * `groupIds` relation, distinct from the singular `groupId` (publisher). Placed independently via the
 * standard-field zone on the create form; submit-driven (no auto-save).
 */
export function BookmarkGroupsField({
  form, groups,
}: BookmarkGroupsFieldProps) {
  const {
    t,
  } = useTranslation();
  const groupCreate = useEntityCreateOption("group", (group) => {
    const current = form.getFieldValue("groupIds");
    if (!current.includes(group.id)) form.setFieldValue("groupIds", [...current, group.id]);
  });

  return (
    <>
      <form.Field name="groupIds">
        {field => (
          <div className="space-y-1">
            <Label>{t("Groups")}</Label>
            <MultiCombobox
              options={groups.map(g => ({
                value: g.id,
                label: g.name,
                names: g.names,
              }))}
              values={field.state.value}
              onValuesChange={field.handleChange}
              placeholder={t("Select groups…")}
              searchPlaceholder={t("Search groups…")}
              emptyText={t("No groups found.")}
              createOption={groupCreate.createOption}
            />
          </div>
        )}
      </form.Field>
      {groupCreate.modal}
    </>
  );
}
