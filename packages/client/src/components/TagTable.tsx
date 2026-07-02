import type { ListSelection } from "../lib/useListSelection";
import type { TagNode } from "@eesimple/types";

import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTagColumns } from "./tables/tagColumns";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the tag tree, with an optional selection column in bulk-select mode. */
export function TagTable({
  tree,
  selection,
}: {
  tree: TagNode[];
  selection: ListSelection;
}) {
  const tagColumns = useTagColumns();
  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<TagNode>(selection, n => n.id)] : []),
        ...tagColumns,
      ]}
      data={tree}
      getSubRows={node => node.children}
    />
  );
}
