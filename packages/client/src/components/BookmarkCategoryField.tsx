import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { Category } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { useEntityCreateOption } from "./useEntityCreateOption";
import { sortFavoritesFirst } from "../lib/favoritesOrder";

import { CategoryIcon } from "@/lib/icons";

interface BookmarkCategoryFieldProps {
  form: BookmarkFormApi;
  categories: Category[];
  /** Optional per-field auto-save hook (edit form); omitted on the create form. */
  onValueChange?: (id: string) => void;
}

/**
 * The bookmark form's "Category" combobox plus the inline create-category modal. Operates on the
 * shared form instance passed in.
 */
export function BookmarkCategoryField({
  form,
  categories,
  onValueChange,
}: BookmarkCategoryFieldProps) {
  const {
    t,
  } = useTranslation();
  const categoryCreate = useEntityCreateOption("category", (category) => {
    form.setFieldValue("categoryId", category.id);
    onValueChange?.(category.id);
  });

  return (
    <>
      <form.AppField name="categoryId">
        {field => (
          <field.ComboboxField
            label={t("Category")}
            placeholder={t("Select a category")}
            searchPlaceholder={t("Search categories…")}
            emptyText={t("No categories found.")}
            onValueChange={onValueChange}
            createOption={categoryCreate.createOption}
            options={sortFavoritesFirst(categories).map(category => ({
              value: category.id,
              label: category.name,
              names: category.names,
              icon: (
                <CategoryIcon
                  name={category.icon}
                  className="size-4 shrink-0"
                />
              ),
            }))}
          />
        )}
      </form.AppField>

      {categoryCreate.modal}
    </>
  );
}
