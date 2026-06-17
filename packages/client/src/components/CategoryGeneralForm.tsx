import type { Category } from "@eesimple/types";

import { z } from "zod";

import { useUpdateCategory } from "../hooks/useCategories";
import { useAppForm } from "../lib/form";

import { Checkbox } from "@/components/ui/checkbox";
import { IconPicker } from "@/components/ui/icon-picker";
import { Label } from "@/components/ui/label";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  icon: z.string().nullable(),
});

interface CategoryGeneralFormProps {
  category: Category;
  /** Render the "show on homepage" toggle beneath the form (edit page only). */
  showHomepageToggle?: boolean;
}

/** Edit a category's name, icon, and description (and optionally its homepage flag). */
export function CategoryGeneralForm({
  category,
  showHomepageToggle = false,
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
          <form.Subscribe selector={state => state.values}>
            {(values) => {
              const dirty
                = values.name.trim() !== category.name
                  || (values.description.trim() || null) !== (category.description ?? null)
                  || values.icon !== category.icon;
              return (
                <form.SubmitButton
                  label="Save changes"
                  size="sm"
                  disabledWhen={!dirty}
                />
              );
            }}
          </form.Subscribe>
        </form.AppForm>
      </form>

      {showHomepageToggle
        ? (
          <div className="flex items-center gap-2">
            <Checkbox
              id={`category-homepage-${category.id}`}
              checked={category.isHomepage}
              onCheckedChange={checked =>
                updateCategory.mutate({
                  id: category.id,
                  input: {
                    isHomepage: checked === true,
                  },
                })}
            />
            <Label htmlFor={`category-homepage-${category.id}`}>
              Show this category on the homepage
            </Label>
          </div>
        )
        : null}
    </div>
  );
}
