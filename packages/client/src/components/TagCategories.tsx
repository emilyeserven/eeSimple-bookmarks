import type { TagNode } from "@eesimple/types";

import { useTranslation } from "react-i18next";

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
    t,
  } = useTranslation();
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
        {t("Only top-level (root) tags can be scoped to categories.")}
      </p>
    );
  }

  const selected = assignedIds ?? [];
  const allCategories = categories ?? [];

  const save = (categoryIds: string[]) => setCategories.mutate(categoryIds, {
    onSuccess: () => notifyFieldSaved(t("Categories")),
    onError: error => notifyFieldSaveError(t("Categories"), describeError(error)),
  });

  return (
    <div className="space-y-1">
      <Label>{t("Categories offering this tag")}</Label>
      <p className="text-xs text-muted-foreground">
        {t("Choose which categories offer this tag when tagging a bookmark. Checking a category that currently allows every tag will limit it to an explicit list. Use “All categories” to offer this tag in every category at once.")}
      </p>
      <div className="rounded-md border p-2">
        <CategoryCheckboxList
          categories={allCategories}
          selectedIds={selected}
          idPrefix={`tag-${tag.id}-category`}
          selectAllLabel={t("All categories")}
          onToggle={id => save(toggleId(selected, id))}
          onToggleAll={selectAll => save(selectAll ? allCategories.map(category => category.id) : [])}
        />
      </div>
    </div>
  );
}
