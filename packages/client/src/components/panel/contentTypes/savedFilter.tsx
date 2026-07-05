/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { ListFilter } from "lucide-react";

import { useSavedFilters } from "../../../hooks/useSavedFilters";
import i18n from "../../../i18n";
import { savedFilterWorkbench } from "../../workbench/savedFilter";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useSavedFilterList() {
  const {
    data, isLoading, error,
  } = useSavedFilters();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(filter => ({
      id: filter.id,
      label: filter.name,
      sublabel: filter.description ?? undefined,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

function SavedFilterView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={savedFilterWorkbench}
      id={id}
      mode="view"
      contentType="saved-filter"
    />
  );
}

function SavedFilterEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={savedFilterWorkbench}
      id={id}
      mode="edit"
      contentType="saved-filter"
    />
  );
}

export const savedFilterContentType: PanelContentTypeDef = {
  type: "saved-filter",
  label: i18n.t("Saved Filters"),
  singular: i18n.t("Saved Filter"),
  icon: ListFilter,
  useList: useSavedFilterList,
  View: SavedFilterView,
  Edit: SavedFilterEdit,
};
