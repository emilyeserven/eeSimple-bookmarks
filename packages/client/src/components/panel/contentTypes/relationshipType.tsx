/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Link2 } from "lucide-react";

import { useRelationshipTypes } from "../../../hooks/useRelationshipTypes";
import { relationshipTypeWorkbench } from "../../workbench/relationshipType";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useRelationshipTypeList() {
  const {
    data, isLoading, error,
  } = useRelationshipTypes();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(relationshipType => ({
      id: relationshipType.id,
      label: relationshipType.name,
      sublabel: relationshipType.directional ? "Directional" : "Symmetric",
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only relationship-type view — the same body + shell the main-app pages render. */
function RelationshipTypeView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={relationshipTypeWorkbench}
      id={id}
      mode="view"
      contentType="relationship-type"
    />
  );
}

/** Relationship-type editor — the same auto-save form the main-app edit tab renders. */
function RelationshipTypeEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={relationshipTypeWorkbench}
      id={id}
      mode="edit"
      contentType="relationship-type"
    />
  );
}

export const relationshipTypeContentType: PanelContentTypeDef = {
  type: "relationship-type",
  label: "Relationship Types",
  singular: "Relationship Type",
  icon: Link2,
  useList: useRelationshipTypeList,
  View: RelationshipTypeView,
  Edit: RelationshipTypeEdit,
};
