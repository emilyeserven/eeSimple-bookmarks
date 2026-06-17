import type { Category } from "@eesimple/types";

import { useState } from "react";

import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "../hooks/useCategories";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconPicker } from "@/components/ui/icon-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Create, list, edit, and delete categories (name, description, and a Lucide icon). */
export function CategoryManager() {
  const {
    data: categories, isLoading, error,
  } = useCategories();
  const createCategory = useCreateCategory();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<string | null>(null);

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
                placeholder="What kind of properties belong here?"
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

interface CategoryCardProps {
  category: Category;
}

function CategoryCard({
  category,
}: CategoryCardProps) {
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");
  const [icon, setIcon] = useState<string | null>(category.icon);

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
        <CardTitle>{category.name}</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => deleteCategory.mutate(category.id)}
        >
          Delete
        </Button>
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
