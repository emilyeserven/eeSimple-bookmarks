import type { SourceDefaults } from "./BookmarkAdvancedSection";
import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { Category } from "@eesimple/types";

import { AddCategoryModal } from "./AddCategoryModal";
import { SourceDefaultCheckbox } from "./BookmarkSourceDefaultCheckbox";

import { CategoryIcon } from "@/lib/icons";

interface BookmarkAdvancedCategoryFieldProps {
  form: BookmarkFormApi;
  lockedCategoryId?: string;
  categories: Category[];
  sourceDefaults: SourceDefaults;
  addCategoryOpen: boolean;
  onAddCategoryOpenChange: (open: boolean) => void;
}

/**
 * The Advanced section's Category control: a combobox with inline "Create category" (or a locked
 * notice when the category is pre-filled), the create modal, and the "set as default for <source>"
 * checkbox shown once a category is chosen.
 */
export function BookmarkAdvancedCategoryField({
  form, lockedCategoryId, categories, sourceDefaults, addCategoryOpen, onAddCategoryOpenChange,
}: BookmarkAdvancedCategoryFieldProps) {
  return (
    <>
      {lockedCategoryId
        ? (
          <p
            className="
              rounded-md border bg-muted px-3 py-2 text-xs text-muted-foreground
            "
          >
            Category is pre-filled (
            <span className="font-medium">
              {categories.find(c => c.id === lockedCategoryId)?.name ?? "a specific category"}
            </span>
            ) — open from any other view to change it.
          </p>
        )
        : (
          <form.AppField name="categoryId">
            {field => (
              <field.ComboboxField
                label="Category"
                placeholder="Select a category"
                searchPlaceholder="Search categories…"
                emptyText="No categories found."
                createOption={{
                  label: "Create category",
                  onSelect: () => onAddCategoryOpenChange(true),
                }}
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

      <AddCategoryModal
        open={addCategoryOpen}
        onOpenChange={onAddCategoryOpenChange}
        onCreated={category => form.setFieldValue("categoryId", category.id)}
      />

      {/* "Set as default category for <source>" — directly under the Category combobox. */}
      {sourceDefaults.showSourceDefault && (
        <form.Subscribe selector={state => state.values.categoryId}>
          {categoryId => (categoryId
            ? (
              <SourceDefaultCheckbox
                checked={sourceDefaults.setCategory}
                onCheckedChange={sourceDefaults.onSetCategory}
              >
                Set as default category for
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
