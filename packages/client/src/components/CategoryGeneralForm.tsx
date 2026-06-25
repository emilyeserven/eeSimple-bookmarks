import type { Category, UpdateCategoryInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { useUpdateCategory } from "../hooks/useCategories";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useAppForm } from "../lib/form";

import { Checkbox } from "@/components/ui/checkbox";
import { IconPicker } from "@/components/ui/icon-picker";
import { Label } from "@/components/ui/label";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  icon: z.string().nullable(),
});

const LABELS: Partial<Record<keyof UpdateCategoryInput, string>> = {
  name: "Name",
  description: "Description",
  icon: "Icon",
  editableOnCard: "Editable on card",
};

interface CategoryGeneralFormProps {
  category: Category;
}

/** Edit a category's name, icon, and description. Each field auto-saves (no Save button). */
export function CategoryGeneralForm({
  category,
}: CategoryGeneralFormProps) {
  const navigate = useNavigate();
  const updateCategory = useUpdateCategory();
  const autoSave = useFieldAutoSave<UpdateCategoryInput, Category>({
    id: category.id,
    update: updateCategory,
    labels: LABELS,
    initial: {
      name: category.name,
      description: category.description ?? null,
      icon: category.icon,
      editableOnCard: category.editableOnCard ?? false,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: category.name,
      description: category.description ?? "",
      icon: category.icon,
    },
    validators: {
      onChange: categorySchema,
    },
  });

  return (
    <div className="space-y-4">
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
              onBlur={() => autoSave.saveField(
                "name",
                field.state.value.trim(),
                {
                  valid: field.state.meta.errors.length === 0,
                  // Renaming changes the slug; follow it so the edit page keeps resolving.
                  onSuccess: (updated) => {
                    if (updated.slug !== category.slug) {
                      void navigate({
                        to: "/categories/$categorySlug/edit/general",
                        params: {
                          categorySlug: updated.slug,
                        },
                      });
                    }
                  },
                },
              )}
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
                onChange={(value) => {
                  field.handleChange(value);
                  autoSave.saveField("icon", value);
                }}
              />
            </div>
          )}
        </form.AppField>
        <form.AppField name="description">
          {field => (
            <field.TextareaField
              label="Description"
              onBlur={() => autoSave.saveField(
                "description",
                field.state.value.trim() || null,
                {
                  valid: field.state.meta.errors.length === 0,
                },
              )}
            />
          )}
        </form.AppField>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="category-editable-on-card"
          checked={category.editableOnCard ?? false}
          onCheckedChange={checked => autoSave.saveField("editableOnCard", checked === true)}
        />
        <Label htmlFor="category-editable-on-card">Show as quick select on bookmark cards</Label>
      </div>
    </div>
  );
}
