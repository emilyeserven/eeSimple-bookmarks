import type { BookmarkFormApi } from "./bookmarkFormSchema";

import { useTranslation } from "react-i18next";

import { MultiCombobox } from "./MultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useGenreMoodTree } from "../hooks/useGenreMoods";
import { genreMoodTreeComboboxOptions } from "../lib/comboboxOptions";

import { Label } from "@/components/ui/label";

interface BookmarkGenreMoodsFieldProps {
  form: BookmarkFormApi;
}

/**
 * The Genres & Moods multi-combobox with inline create, writing the `genreMoodIds` form field.
 * Self-fetches the genre/mood tree (mirroring {@link GenreMoodAssignmentSection}); submit-driven on
 * the create form (no per-change auto-save). Placed independently via the standard-field zone.
 */
export function BookmarkGenreMoodsField({
  form,
}: BookmarkGenreMoodsFieldProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: tree = [],
  } = useGenreMoodTree();
  const genreMoodCreate = useEntityCreateOption("genre-mood", (entry) => {
    const current = form.getFieldValue("genreMoodIds");
    if (!current.includes(entry.id)) form.setFieldValue("genreMoodIds", [...current, entry.id]);
  });

  return (
    <>
      <form.Field name="genreMoodIds">
        {field => (
          <div className="space-y-1">
            <Label>{t("Genres & Moods")}</Label>
            <MultiCombobox
              options={genreMoodTreeComboboxOptions(tree)}
              values={field.state.value}
              onValuesChange={field.handleChange}
              placeholder={t("Add Genres & Moods…")}
              searchPlaceholder={t("Search Genres & Moods…")}
              emptyText={t("No entries found.")}
              createOption={genreMoodCreate.createOption}
            />
          </div>
        )}
      </form.Field>
      {genreMoodCreate.modal}
    </>
  );
}
