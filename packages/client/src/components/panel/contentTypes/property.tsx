/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { SlidersHorizontal } from "lucide-react";

import { useCustomProperties } from "../../../hooks/useCustomProperties";
import { propertyWorkbench } from "../../workbench/property";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function usePropertyList() {
  const {
    data, isLoading, error,
  } = useCustomProperties();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(property => ({
      id: property.id,
      label: property.name,
      sublabel: property.type,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only property view — the same tabbed bodies + shell the main-app property pages render. */
function PropertyView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={propertyWorkbench}
      id={id}
      mode="view"
    />
  );
}

/** Property editor — the same per-tab auto-save forms the main-app edit tabs render. */
function PropertyEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={propertyWorkbench}
      id={id}
      mode="edit"
    />
  );
}

export const propertyContentType: PanelContentTypeDef = {
  type: "property",
  label: "Custom Properties",
  singular: "Custom Property",
  icon: SlidersHorizontal,
  useList: usePropertyList,
  View: PropertyView,
  Edit: PropertyEdit,
};
