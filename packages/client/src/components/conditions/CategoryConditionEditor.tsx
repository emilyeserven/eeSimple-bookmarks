import type { Category, CategoryCondition } from "@eesimple/types";

import { createElement } from "react";

import { MultiCombobox } from "../MultiCombobox";

import { CategoryIcon } from "@/lib/icons";

interface CategoryConditionEditorProps {
  value: CategoryCondition;
  categories: Category[];
  onChange: (next: CategoryCondition) => void;
}

/** Controlled multi-select editor for a "category is one of …" condition. */
export function CategoryConditionEditor({
  value, categories, onChange,
}: CategoryConditionEditorProps) {
  return (
    <MultiCombobox
      aria-label="Categories"
      placeholder="Any category"
      options={categories.map(category => ({
        value: category.id,
        label: category.name,
        // createElement (not JSX) sidesteps a stylistic-rule conflict on inline multi-prop JSX.
        icon: createElement(CategoryIcon, {
          name: category.icon,
          className: "size-4",
        }),
      }))}
      values={value.categoryIds}
      onValuesChange={categoryIds =>
        onChange({
          ...value,
          categoryIds,
        })}
    />
  );
}
