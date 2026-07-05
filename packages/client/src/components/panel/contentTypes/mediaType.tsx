/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Clapperboard } from "lucide-react";

import { useMediaTypes } from "../../../hooks/useMediaTypes";
import i18n from "../../../i18n";
import { mediaTypeWorkbench } from "../../workbench/mediaType";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useMediaTypeList() {
  const {
    data, isLoading, error,
  } = useMediaTypes();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(mediaType => ({
      id: mediaType.id,
      label: mediaType.name,
      sublabel: mediaType.builtIn ? i18n.t("Built-in") : i18n.t("Custom"),
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only media-type view — the same tabbed bodies + shell the main-app media-type pages render. */
function MediaTypeView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={mediaTypeWorkbench}
      id={id}
      mode="view"
      contentType="media-type"
    />
  );
}

/** Media-type editor — the same per-tab auto-save forms the main-app edit tabs render. */
function MediaTypeEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={mediaTypeWorkbench}
      id={id}
      mode="edit"
      contentType="media-type"
    />
  );
}

export const mediaTypeContentType: PanelContentTypeDef = {
  type: "media-type",
  label: i18n.t("Media Types"),
  singular: i18n.t("Media Type"),
  icon: Clapperboard,
  useList: useMediaTypeList,
  View: MediaTypeView,
  Edit: MediaTypeEdit,
};
