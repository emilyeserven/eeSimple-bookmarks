import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { useBulkDeleteCustomProperties, useCustomProperties } from "./useCustomProperties";
import { useHeaderSearchFilter } from "./useHeaderSearchFilter";
import { useSetListingPage } from "./useListingPage";
import { useRegisterBulkSelect } from "./useRegisterBulkSelect";
import { useRegisterHeaderSearch } from "./useRegisterHeaderSearch";
import { useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { TYPE_LABELS } from "../lib/propertyFormat";
import { useListSelection } from "../lib/useListSelection";

/** Owns the listing state, search filtering, and bulk-select wiring for {@link CustomPropertyManager}. */
export function useCustomPropertyManager() {
  const {
    data: properties, isLoading, error,
  } = useCustomProperties();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("custom-properties-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: "New property",
  });
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns("custom-properties-listing");
  const viewMode = useViewMode("custom-properties-listing");

  const all = properties ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    all,
    (property, query) => property.name.toLowerCase().includes(query)
      || TYPE_LABELS[property.type].toLowerCase().includes(query),
  );

  const deletableIds = filtered.filter(p => !p.builtIn).map(p => p.id);
  const selection = useListSelection("custom-properties-listing", deletableIds);
  useRegisterBulkSelect("custom-properties-listing");
  const bulkDelete = useBulkDeleteCustomProperties();

  return {
    properties,
    isLoading,
    error,
    modalOpen,
    setModalOpen,
    navigate,
    columns,
    viewMode,
    all,
    rawQuery,
    hasQuery,
    filtered,
    deletableIds,
    selection,
    bulkDelete,
  };
}
