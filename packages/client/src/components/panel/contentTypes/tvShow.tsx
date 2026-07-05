/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Tv } from "lucide-react";

import { useTvShows } from "../../../hooks/useTvShows";
import i18n from "../../../i18n";
import { tvShowWorkbench } from "../../workbench/tvShow";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useTvShowList() {
  const {
    data, isLoading, error,
  } = useTvShows();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(show => ({
      id: show.id,
      label: show.name,
      sublabel: show.year ? String(show.year) : undefined,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only TV-show view — the same body + shell the main-app TV-show pages render. */
function TvShowView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={tvShowWorkbench}
      id={id}
      mode="view"
      contentType="tv-show"
    />
  );
}

/** TV-show editor — the same auto-save form the main-app edit tab renders. */
function TvShowEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={tvShowWorkbench}
      id={id}
      mode="edit"
      contentType="tv-show"
    />
  );
}

export const tvShowContentType: PanelContentTypeDef = {
  type: "tv-show",
  label: i18n.t("TV Shows"),
  singular: i18n.t("TV Show"),
  icon: Tv,
  useList: useTvShowList,
  View: TvShowView,
  Edit: TvShowEdit,
};
