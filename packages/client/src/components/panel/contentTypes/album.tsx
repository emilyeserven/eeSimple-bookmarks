/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Disc3 } from "lucide-react";

import { useAlbums } from "../../../hooks/useAlbums";
import { albumWorkbench } from "../../workbench/album";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useAlbumList() {
  const {
    data, isLoading, error,
  } = useAlbums();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(album => ({
      id: album.id,
      label: album.name,
      sublabel: album.year ? String(album.year) : undefined,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only album view — the same body + shell the main-app album pages render. */
function AlbumView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={albumWorkbench}
      id={id}
      mode="view"
      contentType="album"
    />
  );
}

/** Album editor — the same auto-save form the main-app edit tab renders. */
function AlbumEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={albumWorkbench}
      id={id}
      mode="edit"
      contentType="album"
    />
  );
}

export const albumContentType: PanelContentTypeDef = {
  type: "album",
  label: "Albums",
  singular: "Album",
  icon: Disc3,
  useList: useAlbumList,
  View: AlbumView,
  Edit: AlbumEdit,
};
