/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";
import type { FC } from "react";

import { useMemo } from "react";

import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useLocationTree } from "../../../hooks/useLocations";
import i18n from "../../../i18n";
import { flattenTree } from "../../../lib/tagTree";
import { LocationForm } from "../../LocationForm";
import { locationWorkbench } from "../../workbench/location";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";
import { usePanelControls } from "../usePanelControls";

import { NEW_SENTINEL } from "@/lib/drawerSearch";

function useLocationList() {
  const {
    data, isLoading, error,
  } = useLocationTree();
  const items = useMemo<PanelListItem[]>(
    () => flattenTree(data ?? []).map(({
      node, depth,
    }) => ({
      id: node.id,
      label: `${"— ".repeat(depth)}${node.name}`,
      // Romanized form renders beside the name via the shared toggle-aware RomanizedLabel; the
      // children count is the de-emphasized sublabel.
      romanized: node.romanizedName,
      sublabel: node.children.length > 0
        ? i18n.t("{{count}} children", {
          count: node.children.length,
        })
        : undefined,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

const LocationView: FC<{ id: string }> = ({
  id,
}) => (
  <EntityWorkbenchPanel
    workbench={locationWorkbench}
    id={id}
    mode="view"
    contentType="location"
  />
);

/** Create a new location in the panel, then close it. */
function LocationCreateForm() {
  const {
    t,
  } = useTranslation();
  const {
    close,
  } = usePanelControls();
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t("New location")}</h2>
      <LocationForm onCreated={close} />
    </div>
  );
}

// Creating a location keeps its submit form; editing an existing one reuses the workbench.
const LocationEdit: FC<{ id: string }> = ({
  id,
}) => (id === NEW_SENTINEL
  ? <LocationCreateForm />
  : (
    <EntityWorkbenchPanel
      workbench={locationWorkbench}
      id={id}
      mode="edit"
      contentType="location"
    />
  ));

export const locationContentType: PanelContentTypeDef = {
  type: "location",
  label: i18n.t("Locations"),
  singular: i18n.t("Location"),
  icon: MapPin,
  useList: useLocationList,
  View: LocationView,
  Edit: LocationEdit,
};
