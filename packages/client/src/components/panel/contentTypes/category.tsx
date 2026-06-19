/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Folder } from "lucide-react";

import { Loading, Problem } from "./status";
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
  const {
    data, isLoading, error,
  } = useCategories();
  if (isLoading) return <Loading />;
  if (error) return <Problem>{error.message}</Problem>;
  const category = (data ?? []).find(item => item.id === id);
  if (!category) return <Problem>Category not found.</Problem>;
  return <CategoryPreviewCard category={category} />;
}

/** Editable category, reusing the settings `CategoryCard` (inline-editable, links to full edit). */
function CategoryEdit({
  id,
}: {
  id: string;
}) {
  const {
    data, isLoading, error,
  } = useCategories();
  const dismiss = usePanelDismissAfterDelete();
  if (isLoading) return <Loading />;
  if (error) return <Problem>{error.message}</Problem>;
  const category = (data ?? []).find(item => item.id === id);
  if (!category) return <Problem>Category not found.</Problem>;
  return (
    <CategoryCard
      category={category}
      onDeleted={dismiss}
    />
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
