import type { LocationNode } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { bookmarkCountColumn } from "./columnHelpers";
import { LocationNameCell, LocationPlaceTypeCell, LocationRelationCell } from "./locationCells";
import i18n from "../../i18n";

/** Column definitions for the Locations listing Table view (a flattened, expandable tree). */
export function useLocationColumns(): ColumnDef<LocationNode>[] {
  return useMemo(
    () => [
      {
        id: "name",
        header: i18n.t("Name"),
        cell: ({
          row,
        }) => <LocationNameCell row={row} />,
      },
      {
        id: "placeType",
        header: i18n.t("Place type"),
        cell: ({
          row,
        }) => <LocationPlaceTypeCell row={row} />,
      },
      {
        id: "locationRelation",
        header: i18n.t("Location relation"),
        cell: ({
          row,
        }) => <LocationRelationCell row={row} />,
      },
      bookmarkCountColumn<LocationNode>(),
    ],
    [],
  );
}
