/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Folder } from "lucide-react";

import { useCategories } from "../../../hooks/useCategories";
import { categoryWorkbench } from "../../workbench/category";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

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

/** Read-only category view — the same tabbed bodies + shell the main-app category pages render. */
function CategoryView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={categoryWorkbench}
      id={id}
      mode="view"
    />
  );
}

/** Category editor — the same per-tab auto-save forms the main-app edit tabs render. */
function CategoryEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={categoryWorkbench}
      id={id}
      mode="edit"
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
