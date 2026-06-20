import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { Category } from "@eesimple/types";

import { AddCategoryModal } from "./AddCategoryModal";

import { CategoryIcon } from "@/lib/icons";

interface BookmarkCategoryFieldProps {
  form: BookmarkFormApi;
  categories: Category[];
  addCategoryOpen: boolean;
  setAddCategoryOpen: (open: boolean) => void;
}

/**
 * The bookmark form's "Category" combobox plus the inline create-category modal. Operates on the
 * shared form instance passed in.
 */
export function BookmarkCategoryField({
  form,
  categories,
  addCategoryOpen,
  setAddCategoryOpen,
}: BookmarkCategoryFieldProps) {
  return (
    <>
      <form.AppField name="categoryId">
        {field => (
          <field.ComboboxField
            label="Category"
            placeholder="Select a category"
            searchPlaceholder="Search categories…"
            emptyText="No categories found."
            createOption={{
              label: "Create category",
              onSelect: () => setAddCategoryOpen(true),
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

      <AddCategoryModal
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onCreated={category => form.setFieldValue("categoryId", category.id)}
      />
    </>
  );
}
