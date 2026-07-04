import type { BookmarkFormApi } from "./bookmarkFormSchema";

import { useTranslation } from "react-i18next";

import { EntityNamesEditor } from "./entityNames/EntityNamesEditor";
import { Label } from "./ui/label";

interface BookmarkRomanizedNameFieldProps {
  form: BookmarkFormApi;
}

/**
 * The "Other titles" multilingual names editor, staged into the form's `names` field. Extracted so
 * it can be placed independently of the Name field. Create-only — the entries are submitted with
 * the bookmark create payload; edit mode manages names via its own `EntityNamesTabEditor`.
 */
export function BookmarkRomanizedNameField({
  form,
}: BookmarkRomanizedNameFieldProps) {
  const {
    t,
  } = useTranslation();

  return (
    <form.Field name="names">
      {field => (
        <div className="space-y-1">
          <Label>{t("Other titles")}</Label>
          <EntityNamesEditor
            value={field.state.value}
            onChange={field.handleChange}
          />
        </div>
      )}
    </form.Field>
  );
}
