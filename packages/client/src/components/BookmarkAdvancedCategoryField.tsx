import type { SourceDefaults } from "./BookmarkAdvancedSection";
import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { Category } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { SourceDefaultCheckbox } from "./BookmarkSourceDefaultCheckbox";
import { useEntityCreateOption } from "./useEntityCreateOption";

import { CategoryIcon } from "@/lib/icons";

interface BookmarkAdvancedCategoryFieldProps {
  form: BookmarkFormApi;
  lockedCategoryId?: string;
  categories: Category[];
  sourceDefaults: SourceDefaults;
}

/**
 * The Advanced section's Category control: a combobox with inline "Create category" (or a locked
 * notice when the category is pre-filled), the create modal, and the "set as default for <source>"
 * checkbox shown once a category is chosen.
 */
export function BookmarkAdvancedCategoryField({
  form, lockedCategoryId, categories, sourceDefaults,
}: BookmarkAdvancedCategoryFieldProps) {
  const {
    t,
  } = useTranslation();
  const categoryCreate = useEntityCreateOption("category", category => form.setFieldValue("categoryId", category.id));

  return (
    <>
      {lockedCategoryId
        ? (
          <p
            className="
              rounded-md border bg-muted px-3 py-2 text-xs text-muted-foreground
            "
          >
            {t("Category is pre-filled (")}
            <span className="font-medium">
              {categories.find(c => c.id === lockedCategoryId)?.name ?? t("a specific category")}
            </span>
            {t(") — open from any other view to change it.")}
          </p>
        )
        : (
          <form.AppField name="categoryId">
            {field => (
              <field.ComboboxField
                label={t("Category")}
                placeholder={t("Select a category")}
                searchPlaceholder={t("Search categories…")}
                emptyText={t("No categories found.")}
                createOption={categoryCreate.createOption}
                options={categories.map(category => ({
                  value: category.id,
                  label: category.name,
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
        )}

      {categoryCreate.modal}

      {/* "Set as default category for <source>" — directly under the Category combobox. */}
      {sourceDefaults.showSourceDefault && (
        <form.Subscribe selector={state => state.values.categoryId}>
          {categoryId => (categoryId
            ? (
              <SourceDefaultCheckbox
                checked={sourceDefaults.setCategory}
                onCheckedChange={sourceDefaults.onSetCategory}
              >
                {t("Set as default category for")}
                {" "}
                {sourceDefaults.label}
              </SourceDefaultCheckbox>
            )
            : null)}
        </form.Subscribe>
      )}
    </>
  );
}
