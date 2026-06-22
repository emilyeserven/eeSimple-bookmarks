/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Layers } from "lucide-react";

import { usePropertyGroups } from "../../../hooks/usePropertyGroups";
import { propertyGroupWorkbench } from "../../workbench/propertyGroup";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function usePropertyGroupList() {
  const {
    data, isLoading, error,
  } = usePropertyGroups();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(group => ({
      id: group.id,
      label: group.name,
      sublabel: group.propertyCount != null ? `${group.propertyCount} properties` : undefined,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only property-group view — the same body + shell the main-app property-group pages render. */
function PropertyGroupView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={propertyGroupWorkbench}
      id={id}
      mode="view"
    />
  );
}

/** Property-group editor — the same auto-save form the main-app edit tab renders. */
function PropertyGroupEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={propertyGroupWorkbench}
      id={id}
      mode="edit"
    />
  );
}

export const propertyGroupContentType: PanelContentTypeDef = {
  type: "property-group",
  label: "Property Groups",
  singular: "Property Group",
  icon: Layers,
  useList: usePropertyGroupList,
  View: PropertyGroupView,
  Edit: PropertyGroupEdit,
};
