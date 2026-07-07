import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { TagNode } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { BookmarkTagsField } from "./BookmarkTagsField";

interface BookmarkExcludedTagsFieldProps {
  form: BookmarkFormApi;
  tagTree: TagNode[];
}

/**
 * The autofill tag-blacklist picker, writing the `blacklistedTagIds` form field. Submit-driven on
 * the create form. Placed independently via the standard-field zone.
 */
export function BookmarkExcludedTagsField({
  form, tagTree,
}: BookmarkExcludedTagsFieldProps) {
  const {
    t,
  } = useTranslation();
  return (
    <form.Field name="blacklistedTagIds">
      {field => (
        <BookmarkTagsField
          tree={tagTree}
          selectedIds={field.state.value}
          onToggle={(id) => {
            const current = field.state.value;
            field.handleChange(
              current.includes(id)
                ? current.filter(tagId => tagId !== id)
                : [...current, id],
            );
          }}
          label={t("Excluded Tags")}
          description={t("Tags toggled here will never be auto-applied by autofill rules.")}
        />
      )}
    </form.Field>
  );
}
