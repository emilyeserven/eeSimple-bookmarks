/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { MapPinned } from "lucide-react";

import { usePlaceTypes } from "../../../hooks/usePlaceTypes";
import { placeTypeWorkbench } from "../../workbench/placeType";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function usePlaceTypeList() {
  const {
    data, isLoading, error,
  } = usePlaceTypes();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(placeType => ({
      id: placeType.id,
      label: placeType.name,
      sublabel: placeType.locationCount === 1
        ? "1 location"
        : `${placeType.locationCount} locations`,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only place-type view — the same body + shell the main-app place-type pages render. */
function PlaceTypeView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={placeTypeWorkbench}
      id={id}
      mode="view"
      contentType="place-type"
    />
  );
}

/** Place-type editor — the same auto-save form the main-app edit tab renders. */
function PlaceTypeEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={placeTypeWorkbench}
      id={id}
      mode="edit"
      contentType="place-type"
    />
  );
}

export const placeTypeContentType: PanelContentTypeDef = {
  type: "place-type",
  label: "Place Types",
  singular: "Place Type",
  icon: MapPinned,
  useList: usePlaceTypeList,
  View: PlaceTypeView,
  Edit: PlaceTypeEdit,
};
