import type { ListSelection } from "../lib/useListSelection";
import type { SavedFilter } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useSavedFilterColumns } from "./tables/savedFilterColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the saved-filter listing, with an optional selection column in bulk-select mode. */
export function SavedFilterTable({
  data,
  selection,
}: {
  data: SavedFilter[];
  selection: ListSelection;
}) {
  const savedFilterColumns = useSavedFilterColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode
          ? [listingSelectionColumn<SavedFilter>(selection, filter => filter.id)]
          : []),
        ...savedFilterColumns,
      ]}
      data={data}
      sortable
      onRowClick={(filter, event) => {
        if (!filter.slug) return;
        const slug = filter.slug;
        rowNav(event, () => {
          void navigate({
            to: "/saved-filters/$filterSlug/info",
            params: {
              filterSlug: slug,
            },
          });
        }, () => {
          void navigate({
            to: "/saved-filters/$filterSlug/edit",
            params: {
              filterSlug: slug,
            },
          });
        });
      }}
    />
  );
}
