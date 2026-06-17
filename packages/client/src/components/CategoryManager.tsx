import type { Category, TagNode } from "@eesimple/types";

import { useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";

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

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<string | null>(null);

  const roots = rootOnly(tagTree ?? []);

  function create() {
    const trimmed = name.trim();
    if (!trimmed) return;
    createCategory.mutate({
      name: trimmed,
      description: description.trim() || null,
      icon,
    });
    setName("");
    setDescription("");
    setIcon(null);
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="
              grid gap-3
              sm:grid-cols-2
            "
          >
            <div className="space-y-1">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                placeholder="e.g. Workflow"
                value={name}
                onChange={event => setName(event.target.value)}
                onKeyDown={event => event.key === "Enter" && create()}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="category-icon">Icon</Label>
              <IconPicker
                aria-label="Category icon"
                value={icon}
                onChange={setIcon}
              />
            </div>
            <div
              className="
                space-y-1
                sm:col-span-2
              "
            >
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                placeholder="What kind of bookmarks belong here?"
                value={description}
                onChange={event => setDescription(event.target.value)}
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={create}
            disabled={!name.trim() || createCategory.isPending}
          >
            Add category
          </Button>
          {createCategory.isError
            ? <p className="text-sm text-destructive">{createCategory.error.message}</p>
            : null}
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

  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");
  const [icon, setIcon] = useState<string | null>(category.icon);

  const enabledRootTags = rootTagIds ?? [];

  const dirty
    = name.trim() !== category.name
      || (description.trim() || null) !== (category.description ?? null)
      || icon !== category.icon;

  function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateCategory.mutate({
      id: category.id,
      input: {
        name: trimmed,
        description: description.trim() || null,
        icon,
      },
    });
  }

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
        <div
          className="
            grid gap-3
            sm:grid-cols-2
          "
        >
          <div className="space-y-1">
            <Label htmlFor={`category-name-${category.id}`}>Name</Label>
            <Input
              id={`category-name-${category.id}`}
              value={name}
              disabled={category.builtIn}
              onChange={event => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`category-icon-${category.id}`}>Icon</Label>
            <IconPicker
              aria-label={`Icon for ${category.name}`}
              value={icon}
              onChange={setIcon}
            />
          </div>
          <div
            className="
              space-y-1
              sm:col-span-2
            "
          >
            <Label htmlFor={`category-description-${category.id}`}>Description</Label>
            <Textarea
              id={`category-description-${category.id}`}
              value={description}
              onChange={event => setDescription(event.target.value)}
            />
          </div>
        </div>

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

        <Button
          type="button"
          size="sm"
          onClick={save}
          disabled={!dirty || !name.trim() || updateCategory.isPending}
        >
          Save changes
        </Button>
      </CardContent>
    </Card>
  );
}
