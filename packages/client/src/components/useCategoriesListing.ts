import type { Category } from "@eesimple/types";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { useBulkDeleteCategories, useCategories } from "../hooks/useCategories";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { useListSelection } from "../lib/useListSelection";

/** All resolved state + handlers the Categories listing page renders. Bundling the data/registration
 * hooks here keeps the page component thin and under the complexity / dependency caps. The
 * table-view column wiring lives in `CategoriesTable` instead. */
export interface CategoriesListingState {
  categories: Category[] | undefined;
  isLoading: boolean;
  error: Error | null;
  allCategories: Category[];
  filtered: Category[];
  rawQuery: string;
  hasQuery: boolean;
  columns: ReturnType<typeof useBookmarkColumns>;
  viewMode: ReturnType<typeof useViewMode>;
  selection: ReturnType<typeof useListSelection>;
  deletableIds: string[];
  bulkDelete: ReturnType<typeof useBulkDeleteCategories>;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  goToEdit: (slug: string) => void;
  goToView: (slug: string) => void;
}

export function useCategoriesListing(): CategoriesListingState {
  const {
    data: categories, isLoading, error,
  } = useCategories();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("categories-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: "New category",
  });
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns("categories-listing");
  const viewMode = useViewMode("categories-listing");

  const allCategories = categories ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    allCategories,
    (category, query) => category.name.toLowerCase().includes(query)
      || (category.description ?? "").toLowerCase().includes(query),
  );

  const deletableIds = filtered.filter(c => !c.builtIn).map(c => c.id);
  const selection = useListSelection("categories-listing", deletableIds);
  useRegisterBulkSelect("categories-listing");
  const bulkDelete = useBulkDeleteCategories();

  function goToEdit(slug: string) {
    void navigate({
      to: "/categories/$categorySlug/edit/general",
      params: {
        categorySlug: slug,
      },
    });
  }
  function goToView(slug: string) {
    void navigate({
      to: "/categories/$categorySlug",
      params: {
        categorySlug: slug,
      },
    });
  }

  return {
    categories,
    isLoading,
    error,
    allCategories,
    filtered,
    rawQuery,
    hasQuery,
    columns,
    viewMode,
    selection,
    deletableIds,
    bulkDelete,
    modalOpen,
    setModalOpen,
    goToEdit,
    goToView,
  };
}
