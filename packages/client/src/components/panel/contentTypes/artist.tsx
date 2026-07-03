/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Mic2 } from "lucide-react";

import { useArtists } from "../../../hooks/useArtists";
import { artistWorkbench } from "../../workbench/artist";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useArtistList() {
  const {
    data, isLoading, error,
  } = useArtists();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(artist => ({
      id: artist.id,
      label: artist.name,
      sublabel: artist.year ? String(artist.year) : undefined,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only artist view — the same body + shell the main-app artist pages render. */
function ArtistView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={artistWorkbench}
      id={id}
      mode="view"
      contentType="artist"
    />
  );
}

/** Artist editor — the same auto-save form the main-app edit tab renders. */
function ArtistEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={artistWorkbench}
      id={id}
      mode="edit"
      contentType="artist"
    />
  );
}

export const artistContentType: PanelContentTypeDef = {
  type: "artist",
  label: "Artists",
  singular: "Artist",
  icon: Mic2,
  useList: useArtistList,
  View: ArtistView,
  Edit: ArtistEdit,
};
