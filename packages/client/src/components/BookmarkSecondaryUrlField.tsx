import type { BookmarkFormApi } from "./bookmarkFormSchema";

import { useTranslation } from "react-i18next";

interface BookmarkSecondaryUrlFieldProps {
  form: BookmarkFormApi;
}

/**
 * The optional "Download URL" (secondary URL) text input, writing the `secondaryUrl` form field. A
 * plain scalar — unlike the primary URL it has no scan / cleanup / rescan chrome and drives no
 * website/channel derivation. Placed independently via the standard-field zone (create form) and
 * reused as the edit field.
 */
export function BookmarkSecondaryUrlField({
  form,
}: BookmarkSecondaryUrlFieldProps) {
  const {
    t,
  } = useTranslation();
  return (
    <form.AppField name="secondaryUrl">
      {field => (
        <field.TextField
          label={t("Download URL")}
          type="url"
          placeholder={t("Optional second link (e.g. a download)")}
        />
      )}
    </form.AppField>
  );
}
