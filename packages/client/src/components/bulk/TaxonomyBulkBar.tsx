import type { ListSelection } from "../../lib/useListSelection";
import type { BulkDeleteResult } from "@eesimple/types";
import type { UseMutationResult } from "@tanstack/react-query";

import { BulkActionBar } from "./BulkActionBar";
import { TaxonomyBulkActions } from "./TaxonomyBulkActions";

interface TaxonomyBulkBarProps {
  selection: ListSelection;
  /** Count of selectable (deletable) items, for the "Select all N" affordance. */
  totalSelectable: number;
  bulkDelete: UseMutationResult<BulkDeleteResult[], Error, string[]>;
  /** Singular/plural noun for the confirm copy, e.g. ["website", "websites"]. */
  noun: [string, string];
}

/** Drop-in bulk-delete bar for a taxonomy listing: pairs the shared action bar with a delete action. */
export function TaxonomyBulkBar({
  selection,
  totalSelectable,
  bulkDelete,
  noun,
}: TaxonomyBulkBarProps) {
  return (
    <BulkActionBar
      count={selection.count}
      totalSelectable={totalSelectable}
      allSelected={selection.allSelected}
      onSelectAll={selection.selectAll}
      onClear={selection.clear}
    >
      <TaxonomyBulkActions
        ids={selection.selectedIds}
        bulkDelete={bulkDelete}
        noun={noun}
        onDone={selection.clear}
      />
    </BulkActionBar>
  );
}
