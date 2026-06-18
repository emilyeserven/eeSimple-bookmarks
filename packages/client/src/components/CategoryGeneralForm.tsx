import type { Category } from "@eesimple/types";

import { z } from "zod";

import { useUpdateCategory } from "../hooks/useCategories";
import { useAppForm } from "../lib/form";

import { IconPicker } from "@/components/ui/icon-picker";
import { Label } from "@/components/ui/label";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  icon: z.string().nullable(),
});

interface CategoryGeneralFormProps {
  category: Category;
}

/** Edit a category's name, icon, and description. */
export function CategoryGeneralForm({
  category,
}: CategoryGeneralFormProps) {
  const updateCategory = useUpdateCategory();

  const form = useAppForm({
    defaultValues: {
      name: category.name,
      description: category.description ?? "",
      icon: category.icon,
    },
    validators: {
      onChange: categorySchema,
    },
    onSubmit: ({
      value,
    }) => {
      updateCategory.mutate({
        id: category.id,
        input: {
          name: value.name.trim(),
          description: value.description.trim() || null,
          icon: value.icon,
        },
      });
    },
  });

  return (
    <div className="space-y-4">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <div
          className="
            grid gap-3
            sm:grid-cols-2
          "
        >
          <form.AppField name="name">
            {field => (
              <field.TextField
                label="Name"
                disabled={category.builtIn}
              />
            )}
          </form.AppField>
          <form.AppField name="icon">
            {field => (
              <div className="space-y-1">
                <Label htmlFor={`category-icon-${category.id}`}>Icon</Label>
                <IconPicker
                  aria-label={`Icon for ${category.name}`}
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              </div>
            )}
          </form.AppField>
          <form.AppField name="description">
            {field => (
              <field.TextareaField label="Description" />
            )}
          </form.AppField>
        </div>

        <form.AppForm>
          <form.SubmitButton
            label="Save changes"
            size="sm"
            requireDirty
          />
        </form.AppForm>
      </form>
    </div>
  );
}
