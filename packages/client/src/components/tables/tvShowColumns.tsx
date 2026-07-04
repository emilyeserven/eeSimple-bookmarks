import type { TvShow } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { plexMediaColumns } from "./columnHelpers";
import { useEditPanelClick } from "../panel/useEditPanelClick";

/** Column definitions for the TV Shows listing Table view. */
export function useTvShowColumns(): ColumnDef<TvShow>[] {
  const editClick = useEditPanelClick();
  return useMemo(
    () => plexMediaColumns<TvShow>({
      editTo: "/taxonomies/tv-shows/$tvShowSlug/edit",
      paramKey: "tvShowSlug",
      panelKind: "tv-show",
      editClick,
    }),
    [editClick],
  );
}
