import type { Category, TagNode } from "@eesimple/types";

import { z } from "zod";

import { TagPicker } from "./TagPicker";
import {
  useCategories,
  useCategoryRootTags,
  useCreateCategory,
  useDeleteCategory,
  useHomepageTags,
  useSetCategoryRootTags,
  useSetHomepageTags,
  useUpdateCategory,
} from "../hooks/useCategories";
import { useTagTree } from "../hooks/useTags";
import { useAppForm } from "../lib/form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { IconPicker } from "@/components/ui/icon-picker";
import { Label } from "@/components/ui/label";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  icon: z.string().nullable(),
});

/** Strip children so a TagPicker shows only root ("parent") tags. */
function rootOnly(tree: TagNode[]): TagNode[] {
  return tree.map(node => ({
    ...node,
    children: [],
  }));
}

/** Add or remove `id` from `ids`, returning a new array. */
function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
}

/** Create, list, edit, and delete categories, plus homepage and root-tag configuration. */
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
            roots={roots}
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
  roots: TagNode[];
}

function CategoryCard({
  category,
  roots,
}: CategoryCardProps) {
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const {
    data: rootTagIds,
  } = useCategoryRootTags(category.id);
  const setRootTags = useSetCategoryRootTags(category.id);

  const enabledRootTags = rootTagIds ?? [];

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
    <Card>
      <CardHeader
        className="flex-row items-center justify-between gap-2 space-y-0"
      >
        <div className="flex items-center gap-2">
          <CardTitle>{category.name}</CardTitle>
          {category.builtIn ? <Badge variant="secondary">Built-in</Badge> : null}
        </div>
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
          <Label htmlFor={`category-homepage-${category.id}`}>Show this category on the homepage</Label>
        </div>

        <div className="space-y-1">
          <Label>Enabled parent tags</Label>
          <p className="text-xs text-muted-foreground">
            Limit which root tags are offered when tagging a bookmark in this category. Leave all
            unchecked to allow every tag.
          </p>
          <div className="rounded-md border p-2">
            <TagPicker
              tree={roots}
              selectedIds={enabledRootTags}
              onToggle={id => setRootTags.mutate(toggleId(enabledRootTags, id))}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
