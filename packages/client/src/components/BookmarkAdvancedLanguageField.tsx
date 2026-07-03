import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { Language } from "@eesimple/types";

import { useEntityCreateOption } from "./useEntityCreateOption";

interface BookmarkAdvancedLanguageFieldProps {
  form: BookmarkFormApi;
  languages: Language[];
}

/**
 * The Advanced section's Language control: a combobox with inline "Create language" and the create
 * modal. Auto-filled from the scan/ISBN detected language when the field is still empty.
 */
export function BookmarkAdvancedLanguageField({
  form, languages,
}: BookmarkAdvancedLanguageFieldProps) {
  const languageCreate = useEntityCreateOption("language", language => form.setFieldValue("languageId", language.id));

  return (
    <>
      <form.AppField name="languageId">
        {field => (
          <field.ComboboxField
            label="Language"
            placeholder="No language"
            searchPlaceholder="Search languages…"
            emptyText="No languages found."
            createOption={languageCreate.createOption}
            options={languages.map(l => ({
              value: l.id,
              label: l.name,
            }))}
          />
        )}
      </form.AppField>
      {languageCreate.modal}
    </>
  );
}
