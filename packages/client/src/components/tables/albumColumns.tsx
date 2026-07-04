import type { Album } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { plexMediaColumns } from "./columnHelpers";
import { useEditPanelClick } from "../panel/useEditPanelClick";

/** Column definitions for the Albums listing Table view. */
export function useAlbumColumns(): ColumnDef<Album>[] {
  const editClick = useEditPanelClick();
  return useMemo(
    () => plexMediaColumns<Album>({
      editTo: "/taxonomies/albums/$albumSlug/edit",
      paramKey: "albumSlug",
      panelKind: "album",
      editClick,
    }),
    [editClick],
  );
}
