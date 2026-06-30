import type { useListSelection } from "../lib/useListSelection";
import type { LocationNode } from "@eesimple/types";

import { useLocationColumns } from "./tables/locationColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the Locations listing: the location columns, prefixed with a select column in selection mode. */
export function LocationTableView({
  sortedTree,
  selection,
}: {
  sortedTree: LocationNode[];
  selection: ReturnType<typeof useListSelection>;
}) {
  const locationColumns = useLocationColumns();

  return (
    <DataTable
      columns={[
        ...(selection.mode
          ? [listingSelectionColumn<LocationNode>(selection, n => n.id)]
          : []),
        ...locationColumns,
      ]}
      data={sortedTree}
      getSubRows={node => node.children}
    />
  );
}
