import type { Category, CustomProperty } from "@eesimple/types";

import { z } from "zod";

import { CategoryCheckboxList } from "./PropertyFormFields";
import { useUpdateCustomProperty } from "../hooks/useCustomProperties";
import { useAppForm } from "../lib/form";
import { toggleId } from "../lib/propertyForm";

const categoriesSchema = z.object({
  categoryIds: z.array(z.string()),
  allCategories: z.boolean(),
});

interface PropertyCategoriesFormProps {
  property: CustomProperty;
  categories: Category[];
}

/** Choose which categories a custom property applies to (or all, incl. future ones). */
export function PropertyCategoriesForm({
  property, categories,
}: PropertyCategoriesFormProps) {
  const updateProperty = useUpdateCustomProperty();
  const idPrefix = `property-${property.id}-category`;

  const form = useAppForm({
    defaultValues: {
      categoryIds: property.categoryIds,
      allCategories: property.allCategories,
    },
    validators: {
      onChange: categoriesSchema,
    },
    onSubmit: ({
      value,
    }) => {
      updateProperty.mutate({
        id: property.id,
        input: {
          categoryIds: value.categoryIds,
          allCategories: value.allCategories,
        },
      });
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Subscribe selector={state => state.values.allCategories}>
        {allCategories => (
          <form.AppField name="categoryIds">
            {field => (
              <CategoryCheckboxList
                categories={categories}
                selectedIds={field.state.value}
                allCategories={allCategories}
                onToggle={(id) => {
                  if (allCategories) {
                    // Toggling one category drops the "all categories" flag and falls back to an
                    // explicit list of every current category except the one just unchecked.
                    form.setFieldValue("allCategories", false);
                    field.handleChange(
                      categories.map(category => category.id).filter(categoryId => categoryId !== id),
                    );
                  }
                  else {
                    field.handleChange(toggleId(field.state.value, id));
                  }
                }}
                onToggleAll={(selectAll) => {
                  // Select all also means "apply to categories created later" via the flag.
                  form.setFieldValue("allCategories", selectAll);
                  field.handleChange(selectAll ? categories.map(category => category.id) : []);
                }}
                idPrefix={idPrefix}
              />
            )}
          </form.AppField>
        )}
      </form.Subscribe>

      <form.AppForm>
        <form.SubmitButton
          label="Save changes"
          pendingLabel="Saving…"
          size="sm"
        />
      </form.AppForm>
      {updateProperty.isError
        ? <p className="text-sm text-destructive">{updateProperty.error.message}</p>
        : null}
    </form>
  );
}
