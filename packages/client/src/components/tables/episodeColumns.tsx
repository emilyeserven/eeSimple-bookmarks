import type { Episode } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { plexMediaColumns } from "./columnHelpers";
import { useEditPanelClick } from "../panel/useEditPanelClick";

/** Column definitions for the Episodes listing Table view. */
export function useEpisodeColumns(): ColumnDef<Episode>[] {
  const editClick = useEditPanelClick();
  return useMemo(
    () => plexMediaColumns<Episode>({
      editTo: "/taxonomies/episodes/$episodeSlug/edit",
      paramKey: "episodeSlug",
      panelKind: "episode",
      editClick,
    }),
    [editClick],
  );
}
