import type { ListSelection } from "../lib/useListSelection";
import type { Person } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { usePersonColumns } from "./tables/personColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the people listing, with an optional selection column in bulk-select mode. */
export function PersonTable({
  people,
  selection,
}: {
  people: Person[];
  selection: ListSelection;
}) {
  const personColumns = usePersonColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<Person>(selection, a => a.id)] : []),
        ...personColumns,
      ]}
      data={people}
      sortable
      onRowClick={(person, event) =>
        rowNav(event, () => {
          void navigate({
            to: "/taxonomies/people/$personSlug",
            params: {
              personSlug: person.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/people/$personSlug/edit",
            params: {
              personSlug: person.slug,
            },
          });
        })}
    />
  );
}
