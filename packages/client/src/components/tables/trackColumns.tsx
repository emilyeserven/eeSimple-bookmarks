import type { Track } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { plexMediaColumns } from "./columnHelpers";
import { useEditPanelClick } from "../panel/useEditPanelClick";

/** Column definitions for the Tracks listing Table view. */
export function useTrackColumns(): ColumnDef<Track>[] {
  const editClick = useEditPanelClick();
  return useMemo(
    () => plexMediaColumns<Track>({
      editTo: "/taxonomies/tracks/$trackSlug/edit",
      paramKey: "trackSlug",
      panelKind: "track",
      editClick,
    }),
    [editClick],
  );
}
