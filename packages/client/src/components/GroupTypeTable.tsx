import type { ListSelection } from "../lib/useListSelection";
import type { GroupType } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useGroupTypeColumns } from "./tables/groupTypeColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the group-type listing. */
export function GroupTypeTable({
  data,
  selection,
}: {
  data: GroupType[];
  selection: ListSelection;
}) {
  const columns = useGroupTypeColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<GroupType>(selection, p => p.id)] : []),
        ...columns,
      ]}
      data={data}
      sortable
      onRowClick={(groupType, event) =>
        rowNav(event, () => {
          void navigate({
            to: "/taxonomies/group-types/$groupTypeSlug",
            params: {
              groupTypeSlug: groupType.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/group-types/$groupTypeSlug/edit/general",
            params: {
              groupTypeSlug: groupType.slug,
            },
          });
        })}
    />
  );
}
