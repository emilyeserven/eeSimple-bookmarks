import type { ListSelection } from "../lib/useListSelection";
import type { GenreMoodNode } from "@eesimple/types";

import { useGenreMoodColumns } from "./tables/genreMoodColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the Genres & Moods tree, with an optional selection column in bulk-select mode. */
export function GenreMoodTable({
  tree,
  selection,
}: {
  tree: GenreMoodNode[];
  selection: ListSelection;
}) {
  const genreMoodColumns = useGenreMoodColumns();
  return (
    <DataTable
      columns={[
        ...(selection.mode
          ? [listingSelectionColumn<GenreMoodNode>(selection, n => n.id)]
          : []),
        ...genreMoodColumns,
      ]}
      data={tree}
      getSubRows={node => node.children}
    />
  );
}
