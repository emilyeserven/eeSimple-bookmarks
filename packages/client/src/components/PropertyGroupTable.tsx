import type { ListSelection } from "../lib/useListSelection";
import type { PropertyGroup } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { usePropertyGroupColumns } from "./tables/propertyGroupColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the property-group listing. */
export function PropertyGroupTable({
  data,
  selection,
}: {
  data: PropertyGroup[];
  selection: ListSelection;
}) {
  const groupColumns = usePropertyGroupColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<PropertyGroup>(selection, g => g.id)] : []),
        ...groupColumns,
      ]}
      data={data}
      sortable
      onRowClick={(group, event) =>
        rowNav(event, () => {
          void navigate({
            to: "/taxonomies/property-groups/$propertyGroupSlug",
            params: {
              propertyGroupSlug: group.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/property-groups/$propertyGroupSlug/edit/general",
            params: {
              propertyGroupSlug: group.slug,
            },
          });
        })}
    />
  );
}
