import type { Category } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { z } from "zod";

import { CategoryGeneralForm } from "./CategoryGeneralForm";
import { useEditPanelClick } from "./panel/useEditPanelClick";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
} from "../hooks/useCategories";
import { useAppForm } from "../lib/form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconPicker } from "@/components/ui/icon-picker";
import { Label } from "@/components/ui/label";
import { CategoryIcon } from "@/lib/icons";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  icon: z.string().nullable(),
});

/** Create and list categories; each row links to a category's full edit page. */
export function CategoryManager() {
  const {
    data: categories, isLoading, error,
  } = useCategories();
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
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {isLoading ? <p className="text-muted-foreground">Loading categories…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && (categories?.length ?? 0) === 0
        ? <p className="text-muted-foreground">No categories yet. Create one above.</p>
        : null}

      <div className="space-y-4">
        {(categories ?? []).map(category => (
          <Card
            key={category.id}
            className="p-6"
          >
            <CategoryCard category={category} />
          </Card>
        ))}
      </div>
    </section>
  );
}

interface CategoryCardProps {
  category: Category;
  /** Called after a successful delete — e.g. the panel uses it to dismiss itself. */
  onDeleted?: () => void;
}

/** A category row with quick edit (name, icon, description) and a link to its full edit page. */
export function CategoryCard({
  category, onDeleted,
}: CategoryCardProps) {
  const deleteCategory = useDeleteCategory();
  const editClick = useEditPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CategoryIcon
            name={category.icon}
            className="size-5"
          />
          <CardTitle>{category.name}</CardTitle>
          {category.builtIn ? <Badge variant="secondary">Built-in</Badge> : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link
              to="/categories/$categorySlug/edit/general"
              params={{
                categorySlug: category.slug,
              }}
              title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
              onClick={event => editClick(event, "category", category.id)}
            >
              Edit
            </Link>
          </Button>
          {category.builtIn
            ? null
            : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => deleteCategory.mutate(category.id, {
                  onSuccess: onDeleted,
                })}
              >
                Delete
              </Button>
            )}
        </div>
      </div>
      <CategoryGeneralForm category={category} />
    </div>
  );
}
