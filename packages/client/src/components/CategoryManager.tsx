import type { Category, TagNode } from "@eesimple/types";

import { useEffect, useState } from "react";

import { z } from "zod";

import { TagPicker } from "./TagPicker";
import {
  useCategories,
  useCategoryDefaults,
  useCategoryRootTags,
  useCreateCategory,
  useDeleteCategory,
  useHomepageTags,
  useSetCategoryDefaults,
  useSetCategoryRootTags,
  useSetHomepageTags,
  useUpdateCategory,
} from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
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
import { Input } from "@/components/ui/input";
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

        <CategoryDefaultsSection category={category} />
      </CardContent>
    </Card>
  );
}

interface CategoryDefaultsSectionProps {
  category: Category;
}

/**
 * Editor for a category's default custom-property values, applied to new bookmarks added to it.
 * Only properties assigned to this category are shown; calculate properties are computed on save.
 */
function CategoryDefaultsSection({
  category,
}: CategoryDefaultsSectionProps) {
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: defaults,
  } = useCategoryDefaults(category.id);
  const setDefaults = useSetCategoryDefaults(category.id);

  const [numberInputs, setNumberInputs] = useState<Record<string, string>>({});
  const [booleanInputs, setBooleanInputs] = useState<Record<string, boolean>>({});

  // Seed the inputs from the saved defaults once they load (or change).
  useEffect(() => {
    if (!defaults) return;
    setNumberInputs(Object.fromEntries(
      defaults.numberValues.map(entry => [entry.propertyId, String(entry.value)]),
    ));
    setBooleanInputs(Object.fromEntries(
      defaults.booleanValues.map(entry => [entry.propertyId, entry.value]),
    ));
  }, [defaults]);

  const categoryProps = (properties ?? []).filter(property =>
    property.categoryIds.includes(category.id) && property.type !== "calculate");
  if (categoryProps.length === 0) return null;

  function save() {
    const numberValues = categoryProps
      .filter(property => property.type === "number")
      .map(property => ({
        propertyId: property.id,
        raw: numberInputs[property.id] ?? "",
      }))
      .filter(({
        raw,
      }) => raw.trim() !== "" && !Number.isNaN(Number(raw)))
      .map(({
        propertyId, raw,
      }) => ({
        propertyId,
        value: Number(raw),
      }));
    const booleanValues = categoryProps
      .filter(property => property.type === "boolean")
      .map(property => ({
        propertyId: property.id,
        value: booleanInputs[property.id] ?? false,
      }));
    setDefaults.mutate({
      numberValues,
      booleanValues,
    });
  }

  return (
    <div className="space-y-2">
      <Label>Default property values</Label>
      <p className="text-xs text-muted-foreground">
        Prefilled when you add a bookmark to this category. You can still change them per bookmark.
      </p>
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        {categoryProps.map((property) => {
          if (property.type === "number") {
            return (
              <div
                key={property.id}
                className="space-y-1"
              >
                <Label htmlFor={`default-${category.id}-${property.id}`}>
                  {property.name}
                  {property.unitPlural ? ` (${property.unitPlural})` : ""}
                </Label>
                <Input
                  id={`default-${category.id}-${property.id}`}
                  type="number"
                  value={numberInputs[property.id] ?? ""}
                  onChange={event =>
                    setNumberInputs(current => ({
                      ...current,
                      [property.id]: event.target.value,
                    }))}
                />
              </div>
            );
          }
          return (
            <div
              key={property.id}
              className="flex items-center gap-2 self-end"
            >
              <Checkbox
                id={`default-${category.id}-${property.id}`}
                checked={booleanInputs[property.id] ?? false}
                onCheckedChange={checked =>
                  setBooleanInputs(current => ({
                    ...current,
                    [property.id]: checked === true,
                  }))}
              />
              <Label htmlFor={`default-${category.id}-${property.id}`}>{property.name}</Label>
            </div>
          );
        })}
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={save}
      >
        Save defaults
      </Button>
    </div>
  );
}
