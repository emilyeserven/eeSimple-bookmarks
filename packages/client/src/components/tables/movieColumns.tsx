import type { Movie } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { plexMediaColumns } from "./columnHelpers";
import { useEditPanelClick } from "../panel/useEditPanelClick";

/** Column definitions for the Movies listing Table view. */
export function useMovieColumns(): ColumnDef<Movie>[] {
  const editClick = useEditPanelClick();
  return useMemo(
    () => plexMediaColumns<Movie>({
      editTo: "/taxonomies/movies/$movieSlug/edit",
      paramKey: "movieSlug",
      panelKind: "movie",
      editClick,
    }),
    [editClick],
  );
}
