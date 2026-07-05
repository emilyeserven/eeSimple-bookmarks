/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Tv2 } from "lucide-react";

import { useEpisodes } from "../../../hooks/useEpisodes";
import i18n from "../../../i18n";
import { episodeWorkbench } from "../../workbench/episode";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useEpisodeList() {
  const {
    data, isLoading, error,
  } = useEpisodes();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(episode => ({
      id: episode.id,
      label: episode.name,
      sublabel: episode.year ? String(episode.year) : undefined,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only episode view — the same body + shell the main-app episode pages render. */
function EpisodeView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={episodeWorkbench}
      id={id}
      mode="view"
      contentType="episode"
    />
  );
}

/** Episode editor — the same auto-save form the main-app edit tab renders. */
function EpisodeEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={episodeWorkbench}
      id={id}
      mode="edit"
      contentType="episode"
    />
  );
}

export const episodeContentType: PanelContentTypeDef = {
  type: "episode",
  label: i18n.t("Episodes"),
  singular: i18n.t("Episode"),
  icon: Tv2,
  useList: useEpisodeList,
  View: EpisodeView,
  Edit: EpisodeEdit,
};
