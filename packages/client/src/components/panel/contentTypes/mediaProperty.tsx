/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Library } from "lucide-react";

import { useMediaProperties } from "../../../hooks/useMediaProperties";
import i18n from "../../../i18n";
import { mediaPropertyWorkbench } from "../../workbench/mediaProperty";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useMediaPropertyList() {
  const {
    data, isLoading, error,
  } = useMediaProperties();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(mediaProperty => ({
      id: mediaProperty.id,
      label: mediaProperty.name,
      sublabel: mediaProperty.bookCount != null
        ? i18n.t("{{count}} books", {
          count: mediaProperty.bookCount,
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

/** Read-only media-property view — the same body + shell the main-app media-property pages render. */
function MediaPropertyView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={mediaPropertyWorkbench}
      id={id}
      mode="view"
      contentType="media-property"
    />
  );
}

/** Media-property editor — the same auto-save form the main-app edit tab renders. */
function MediaPropertyEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={mediaPropertyWorkbench}
      id={id}
      mode="edit"
      contentType="media-property"
    />
  );
}

export const mediaPropertyContentType: PanelContentTypeDef = {
  type: "media-property",
  label: i18n.t("Media Properties"),
  singular: i18n.t("Media Property"),
  icon: Library,
  useList: useMediaPropertyList,
  View: MediaPropertyView,
  Edit: MediaPropertyEdit,
};
