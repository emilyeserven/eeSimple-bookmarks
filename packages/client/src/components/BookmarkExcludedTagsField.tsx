import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { TagNode } from "@eesimple/types";

import { GatedTagPicker } from "./BookmarkTagsField";

interface BookmarkExcludedTagsFieldProps {
  form: BookmarkFormApi;
  tagTree: TagNode[];
}

/**
 * The autofill tag-blacklist picker, writing the `blacklistedTagIds` form field. Gated by the live
 * category selection like the edit surface. Submit-driven on the create form. Placed independently
 * via the standard-field zone.
 */
export function BookmarkExcludedTagsField({
  form, tagTree,
}: BookmarkExcludedTagsFieldProps) {
  return (
    <form.Subscribe selector={state => state.values.categoryId}>
      {categoryId => (
        <form.Field name="blacklistedTagIds">
          {field => (
            <GatedTagPicker
              categoryId={categoryId}
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
              label="Excluded Tags"
              description="Tags toggled here will never be auto-applied by autofill rules."
            />
          )}
        </form.Field>
      )}
    </form.Subscribe>
  );
}
