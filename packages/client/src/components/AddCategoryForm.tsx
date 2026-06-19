import { z } from "zod";

import { useCreateCategory } from "../hooks/useCategories";
import { useAppForm } from "../lib/form";

import { RowCard } from "@/components/ui/card";
import { IconPicker } from "@/components/ui/icon-picker";
import { Label } from "@/components/ui/label";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  icon: z.string().nullable(),
});

/**
 * Inline "new category" form (name, icon, description). Shared by the Categories taxonomy listing
 * and the `CategoryManager` so the create UI lives in one place.
 */
export function AddCategoryForm() {
  const createCategory = useCreateCategory();

  const form = useAppForm({
    defaultValues: {
      name: "",
      description: "",
      icon: null as string | null,
    },
    validators: {
      onChange: categorySchema,
    },
    onSubmit: ({
      value,
    }) => {
      createCategory.mutate({
        name: value.name.trim(),
        description: value.description.trim() || null,
        icon: value.icon,
      });
      form.reset();
    },
  });

  return (
    <RowCard className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">New category</h2>
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
                placeholder="e.g. Workflow"
              />
            )}
          </form.AppField>
          <form.AppField name="icon">
            {field => (
              <div className="space-y-1">
                <Label htmlFor="category-icon">Icon</Label>
                <IconPicker
                  aria-label="Category icon"
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              </div>
            )}
          </form.AppField>
          <form.AppField name="description">
            {field => (
              <field.TextareaField
                label="Description"
                placeholder="What kind of bookmarks belong here?"
              />
            )}
          </form.AppField>
        </div>

        <form.AppForm>
          <form.SubmitButton label="Add category" />
        </form.AppForm>
        {createCategory.isError
          ? <p className="text-sm text-destructive">{createCategory.error.message}</p>
          : null}
      </form>
    </RowCard>
  );
}
