/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Folder } from "lucide-react";

import { WithPanelItem } from "./status";
import { useCategories } from "../../../hooks/useCategories";
import { CategoryCard } from "../../CategoryCard";
import { CategoryPreviewCard } from "../../CategoryPreviewCard";
import { usePanelDismissAfterDelete } from "../usePanelDismissAfterDelete";

function useCategoryList() {
  const {
    data, isLoading, error,
  } = useCategories();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(category => ({
      id: category.id,
      label: category.name,
      sublabel: category.slug,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only category view, reusing the same `CategoryPreviewCard` the single category page renders. */
function CategoryView({
  id,
}: {
  id: string;
}) {
  const query = useCategories();
  return (
    <WithPanelItem
      queryResult={query}
      id={id}
      notFoundMessage="Category not found."
    >
      {category => <CategoryPreviewCard category={category} />}
    </WithPanelItem>
  );
}

/** Editable category, reusing the settings `CategoryCard` (inline-editable, links to full edit). */
function CategoryEdit({
  id,
}: {
  id: string;
}) {
  const query = useCategories();
  const dismiss = usePanelDismissAfterDelete();
  return (
    <WithPanelItem
      queryResult={query}
      id={id}
      notFoundMessage="Category not found."
    >
      {category => (
        <CategoryCard
          category={category}
          onDeleted={dismiss}
        />
      )}
    </WithPanelItem>
  );
}

export const categoryContentType: PanelContentTypeDef = {
  type: "category",
  label: "Categories",
  singular: "Category",
  icon: Folder,
  useList: useCategoryList,
  View: CategoryView,
  Edit: CategoryEdit,
};
