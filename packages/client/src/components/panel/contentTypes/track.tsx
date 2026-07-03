/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Music } from "lucide-react";

import { useTracks } from "../../../hooks/useTracks";
import { trackWorkbench } from "../../workbench/track";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useTrackList() {
  const {
    data, isLoading, error,
  } = useTracks();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(track => ({
      id: track.id,
      label: track.name,
      sublabel: track.year ? String(track.year) : undefined,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only track view — the same body + shell the main-app track pages render. */
function TrackView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={trackWorkbench}
      id={id}
      mode="view"
      contentType="track"
    />
  );
}

/** Track editor — the same auto-save form the main-app edit tab renders. */
function TrackEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={trackWorkbench}
      id={id}
      mode="edit"
      contentType="track"
    />
  );
}

export const trackContentType: PanelContentTypeDef = {
  type: "track",
  label: "Tracks",
  singular: "Track",
  icon: Music,
  useList: useTrackList,
  View: TrackView,
  Edit: TrackEdit,
};
