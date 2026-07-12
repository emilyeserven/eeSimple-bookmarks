import type { ListSelection } from "../lib/useListSelection";
import type { TaxonomyTermNode } from "@eesimple/types";

import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTaxonomyTermColumns } from "./tables/taxonomyTermColumns";

import { DataTable } from "@/components/ui/data-table";

/** Table view of a taxonomy-term tree, with an optional selection column in bulk-select mode.
 * Mirrors `GenreMoodTable`. */
export function TaxonomyTermTable({
  taxonomySlug,
  tree,
  selection,
}: {
  taxonomySlug: string;
  tree: TaxonomyTermNode[];
  selection: ListSelection;
}) {
  const columns = useTaxonomyTermColumns(taxonomySlug);
  return (
    <DataTable
      columns={[
        ...(selection.mode
          ? [listingSelectionColumn<TaxonomyTermNode>(selection, n => n.id)]
          : []),
        ...columns,
      ]}
      data={tree}
      getSubRows={node => node.children}
    />
  );
}
