import type { TagNode } from "@eesimple/types";

import { CategoryCheckboxList } from "./PropertyFormFields";
import { useCategories } from "../hooks/useCategories";
import { useSetTagCategories, useTagCategories } from "../hooks/useTags";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { toggleId } from "../lib/tag-utils";

import { Label } from "@/components/ui/label";

interface TagCategoriesProps {
  tag: TagNode;
}

/**
 * Reverse of the Categories → Tiered Tags tab: choose which categories include this (root) tag in
 * their root-tag allowlist. Only root tags qualify; checking a category that currently allows every
 * tag narrows it to an explicit list.
 */
export function TagCategories({
  tag,
}: TagCategoriesProps) {
  const {
    data: categories,
  } = useCategories();
  const {
    data: assignedIds,
  } = useTagCategories(tag.id);
  const setCategories = useSetTagCategories(tag.id);

  if (tag.parentId !== null) {
    return (
      <p className="text-sm text-muted-foreground">
        Only top-level (root) tags can be scoped to categories.
      </p>
    );
  }

  const selected = assignedIds ?? [];

  return (
    <div className="space-y-1">
      <Label>Categories offering this tag</Label>
      <p className="text-xs text-muted-foreground">
        Choose which categories offer this tag when tagging a bookmark. Checking a category that
        currently allows every tag will limit it to an explicit list.
      </p>
      <div className="rounded-md border p-2">
        <CategoryCheckboxList
          categories={categories ?? []}
          selectedIds={selected}
          idPrefix={`tag-${tag.id}-category`}
          onToggle={id => setCategories.mutate(toggleId(selected, id), {
            onSuccess: () => notifyFieldSaved("Categories"),
            onError: error => notifyFieldSaveError("Categories", describeError(error)),
          })}
        />
      </div>
    </div>
  );
}
