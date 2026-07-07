import type { ListSelection } from "../lib/useListSelection";
import type { Group } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useGroupColumns } from "./tables/groupColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the groups listing, with an optional selection column in bulk-select mode. */
export function GroupTable({
  groups,
  selection,
}: {
  groups: Group[];
  selection: ListSelection;
}) {
  const groupColumns = useGroupColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<Group>(selection, p => p.id)] : []),
        ...groupColumns,
      ]}
      data={groups}
      sortable
      onRowClick={(group, event) =>
        rowNav(event, () => {
          void navigate({
            to: "/taxonomies/groups/$groupSlug",
            params: {
              groupSlug: group.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/groups/$groupSlug/edit/general",
            params: {
              groupSlug: group.slug,
            },
          });
        })}
    />
  );
}
