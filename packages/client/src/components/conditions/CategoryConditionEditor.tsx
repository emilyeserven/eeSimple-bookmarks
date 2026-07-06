import type { Category, CategoryCondition } from "@eesimple/types";

import { createElement } from "react";

import { useTranslation } from "react-i18next";

import { MultiCombobox } from "../MultiCombobox";
import { useEntityCreateOption } from "../useEntityCreateOption";

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
  const {
    t,
  } = useTranslation();
  const categoryCreate = useEntityCreateOption("category", category =>
    onChange({
      ...value,
      categoryIds: [...value.categoryIds, category.id],
    }));

  return (
    <>
      <MultiCombobox
        aria-label={t("Categories")}
        placeholder={t("Any category")}
        options={categories.map(category => ({
          value: category.id,
          label: category.name,
          names: category.names,
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
        createOption={categoryCreate.createOption}
      />
      {categoryCreate.modal}
    </>
  );
}
