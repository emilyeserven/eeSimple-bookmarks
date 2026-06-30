import type { ListSelection } from "../lib/useListSelection";
import type { PropertyGroup } from "@eesimple/types";

import { PropertyGroupGrid } from "./PropertyGroupGrid";
import { PropertyGroupTable } from "./PropertyGroupTable";
import { useViewMode } from "../lib/bookmarkColumns";

/** Renders the property-group listing as a table or card grid, per the active view mode. */
export function PropertyGroupListBody({
  groups,
  selection,
}: {
  groups: PropertyGroup[];
  selection: ListSelection;
}) {
  const viewMode = useViewMode("property-groups-listing");

  if (groups.length === 0) return null;

  return viewMode === "table"
    ? (
      <PropertyGroupTable
        data={groups}
        selection={selection}
      />
    )
    : (
      <PropertyGroupGrid
        groups={groups}
        selection={selection}
      />
    );
}
