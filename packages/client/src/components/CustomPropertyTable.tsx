import type { useListSelection } from "../lib/useListSelection";
import type { CustomProperty } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useCustomPropertyColumns } from "./tables/customPropertyColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the custom-property listing: sortable rows that nav to view / edit on click. */
export function CustomPropertyTable({
  filtered,
  selection,
}: {
  filtered: CustomProperty[];
  selection: ReturnType<typeof useListSelection>;
}) {
  const navigate = useNavigate();
  const propertyColumns = useCustomPropertyColumns();
  const rowNav = useTableRowNav();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<CustomProperty>(selection, p => p.id, p => !p.builtIn)] : []),
        ...propertyColumns,
      ]}
      data={filtered}
      sortable
      onRowClick={(property, event) =>
        rowNav(event, () => {
          void navigate({
            to: "/custom-properties/$propertySlug",
            params: {
              propertySlug: property.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/custom-properties/$propertySlug/edit/general",
            params: {
              propertySlug: property.slug,
            },
          });
        })}
    />
  );
}
