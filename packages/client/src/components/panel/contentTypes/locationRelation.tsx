/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Waypoints } from "lucide-react";

import { useLocationRelations } from "../../../hooks/useLocationRelations";
import i18n from "../../../i18n";
import { locationRelationWorkbench } from "../../workbench/locationRelation";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useLocationRelationList() {
  const {
    data, isLoading, error,
  } = useLocationRelations();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(relation => ({
      id: relation.id,
      label: relation.name,
      sublabel: i18n.t(relation.bookmarkCount === 1 ? "{{count}} bookmark" : "{{count}} bookmarks", {
        count: relation.bookmarkCount,
      }),
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only location-relation view — the same body + shell the main-app pages render. */
function LocationRelationView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={locationRelationWorkbench}
      id={id}
      mode="view"
      contentType="location-relation"
    />
  );
}

/** Location-relation editor — the same auto-save form the main-app edit tab renders. */
function LocationRelationEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={locationRelationWorkbench}
      id={id}
      mode="edit"
      contentType="location-relation"
    />
  );
}

export const locationRelationContentType: PanelContentTypeDef = {
  type: "location-relation",
  label: i18n.t("Location Relations"),
  singular: i18n.t("Location Relation"),
  icon: Waypoints,
  useList: useLocationRelationList,
  View: LocationRelationView,
  Edit: LocationRelationEdit,
};
