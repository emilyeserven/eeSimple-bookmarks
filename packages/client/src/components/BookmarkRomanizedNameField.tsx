import type { BookmarkFormApi } from "./bookmarkFormSchema";

interface BookmarkRomanizedNameFieldProps {
  form: BookmarkFormApi;
}

/** The optional "Romanized name" text field. Extracted so it can be placed independently of the Name field. */
export function BookmarkRomanizedNameField({
  form,
}: BookmarkRomanizedNameFieldProps) {
  return (
    <form.AppField name="romanizedTitle">
      {field => (
        <field.TextField
          label="Romanized name"
          placeholder="Optional romanized form"
        />
      )}
    </form.AppField>
  );
}
