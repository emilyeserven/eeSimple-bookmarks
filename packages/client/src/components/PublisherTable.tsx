import type { ListSelection } from "../lib/useListSelection";
import type { Publisher } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { usePublisherColumns } from "./tables/publisherColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the publishers listing, with an optional selection column in bulk-select mode. */
export function PublisherTable({
  publishers,
  selection,
}: {
  publishers: Publisher[];
  selection: ListSelection;
}) {
  const publisherColumns = usePublisherColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<Publisher>(selection, p => p.id)] : []),
        ...publisherColumns,
      ]}
      data={publishers}
      sortable
      onRowClick={(publisher, event) =>
        rowNav(event, "publisher", publisher.id, () => {
          void navigate({
            to: "/taxonomies/publishers/$publisherSlug",
            params: {
              publisherSlug: publisher.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/publishers/$publisherSlug/edit/general",
            params: {
              publisherSlug: publisher.slug,
            },
          });
        })}
    />
  );
}
