/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Podcast as PodcastIcon } from "lucide-react";

import { usePodcasts } from "../../../hooks/usePodcasts";
import { podcastWorkbench } from "../../workbench/podcast";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function usePodcastList() {
  const {
    data, isLoading, error,
  } = usePodcasts();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(podcast => ({
      id: podcast.id,
      label: podcast.name,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only podcast view — the same body + shell the main-app podcast pages render. */
function PodcastView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={podcastWorkbench}
      id={id}
      mode="view"
      contentType="podcast"
    />
  );
}

/** Podcast editor — the same auto-save form the main-app edit tab renders. */
function PodcastEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={podcastWorkbench}
      id={id}
      mode="edit"
      contentType="podcast"
    />
  );
}

export const podcastContentType: PanelContentTypeDef = {
  type: "podcast",
  label: "Podcasts",
  singular: "Podcast",
  icon: PodcastIcon,
  useList: usePodcastList,
  View: PodcastView,
  Edit: PodcastEdit,
};
