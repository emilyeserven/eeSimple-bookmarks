import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { CategoryPreviewCard } from "../components/CategoryPreviewCard";
import { useCategories, useCreateCategory } from "../hooks/useCategories";
import { useAppForm } from "../lib/form";

import { Badge } from "@/components/ui/badge";
import { IconPicker } from "@/components/ui/icon-picker";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/categories/")({
  component: CategoriesListingPage,
});

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  icon: z.string().nullable(),
});

/** Inline "new category" form, lifted out of the old Settings page. */
function AddCategoryForm() {
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
    <div className="space-y-4 rounded-lg border bg-card p-4">
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
    </div>
  );
}

/** Browse view for the Categories taxonomy: a list with preview info; each row opens the category. */
function CategoriesListingPage() {
  const {
    data: categories, isLoading, error,
  } = useCategories();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Categories</h1>
          {categories
            ? <Badge variant="secondary">{categories.length}</Badge>
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Group bookmarks by category. Click a category to view it, or edit it for tiered tags,
          custom properties and autofill rules.
        </p>
      </div>

      <AddCategoryForm />

      {isLoading ? <p className="text-muted-foreground">Loading categories…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && (categories?.length ?? 0) === 0
        ? <p className="text-muted-foreground">No categories yet. Create one above.</p>
        : null}

      {categories && categories.length > 0
        ? (
          <ul className="space-y-2">
            {categories.map(category => (
              <CategoryPreviewCard
                key={category.id}
                category={category}
                variant="row"
              />
            ))}
          </ul>
        )
        : null}
    </section>
  );
}
