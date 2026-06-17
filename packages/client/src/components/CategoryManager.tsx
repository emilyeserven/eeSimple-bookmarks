import type { Category, TagNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { z } from "zod";

import { CategoryGeneralForm } from "./CategoryGeneralForm";
import { TagPicker } from "./TagPicker";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useHomepageTags,
  useSetHomepageTags,
} from "../hooks/useCategories";
import { useTagTree } from "../hooks/useTags";
import { useAppForm } from "../lib/form";
import { rootOnly, toggleId } from "../lib/tag-utils";

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
  const {
    data: tagTree,
  } = useTagTree();
  const createCategory = useCreateCategory();

  const roots = rootOnly(tagTree ?? []);

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

      <HomepageTagsCard roots={roots} />

      {isLoading ? <p className="text-muted-foreground">Loading categories…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && (categories?.length ?? 0) === 0
        ? <p className="text-muted-foreground">No categories yet. Create one above.</p>
        : null}

      <div className="space-y-4">
        {(categories ?? []).map(category => (
          <CategoryCard
            key={category.id}
            category={category}
          />
        ))}
      </div>
    </section>
  );
}

interface HomepageTagsCardProps {
  roots: TagNode[];
}

/** Global selector for which tags surface their bookmarks on the homepage. */
function HomepageTagsCard({
  roots,
}: HomepageTagsCardProps) {
  const {
    data: homepageTagIds,
  } = useHomepageTags();
  const setHomepageTags = useSetHomepageTags();
  const selected = homepageTagIds ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Bookmarks carrying one of these tags appear on the homepage, alongside bookmarks in
          homepage categories.
        </p>
        <div className="rounded-md border p-2">
          <TagPicker
            tree={roots}
            selectedIds={selected}
            onToggle={id => setHomepageTags.mutate(toggleId(selected, id))}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface CategoryCardProps {
  category: Category;
}

/** A category row with quick edit (name, icon, description) and a link to its full edit page. */
function CategoryCard({
  category,
}: CategoryCardProps) {
  const deleteCategory = useDeleteCategory();

  return (
    <Card>
      <CardHeader
        className="flex-row items-center justify-between gap-2 space-y-0"
      >
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
                onClick={() => deleteCategory.mutate(category.id)}
              >
                Delete
              </Button>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <CategoryGeneralForm category={category} />
      </CardContent>
    </Card>
  );
}
