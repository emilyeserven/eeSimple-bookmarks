import type { ListSelection } from "../lib/useListSelection";
import type { RelationshipType } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useRelationshipTypeColumns } from "./tables/relationshipTypeColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the relationship-type listing, with an optional selection column in bulk-select mode. */
export function RelationshipTypeTable({
  data,
  selection,
}: {
  data: RelationshipType[];
  selection: ListSelection;
}) {
  const relationshipTypeColumns = useRelationshipTypeColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode
          ? [listingSelectionColumn<RelationshipType>(selection, rt => rt.id, rt => !rt.builtIn)]
          : []),
        ...relationshipTypeColumns,
      ]}
      data={data}
      sortable
      onRowClick={(relationshipType, event) =>
        rowNav(event, "relationship-type", relationshipType.id, () => {
          void navigate({
            to: "/taxonomies/relationship-types/$relationshipTypeSlug/general",
            params: {
              relationshipTypeSlug: relationshipType.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/relationship-types/$relationshipTypeSlug/edit/general",
            params: {
              relationshipTypeSlug: relationshipType.slug,
            },
          });
        })}
    />
  );
}
