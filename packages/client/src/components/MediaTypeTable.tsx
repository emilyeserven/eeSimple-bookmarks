import type { ListSelection } from "../lib/useListSelection";
import type { MediaTypeNode } from "@eesimple/types";

import { useMediaTypeColumns } from "./tables/mediaTypeColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the media-type tree, with an optional selection column in bulk-select mode. */
export function MediaTypeTable({
  tree,
  selection,
}: {
  tree: MediaTypeNode[];
  selection: ListSelection;
}) {
  const mediaTypeColumns = useMediaTypeColumns();
  return (
    <DataTable
      columns={[
        ...(selection.mode
          ? [listingSelectionColumn<MediaTypeNode>(selection, n => n.id, n => !n.builtIn)]
          : []),
        ...mediaTypeColumns,
      ]}
      data={tree}
      getSubRows={node => node.children}
    />
  );
}
