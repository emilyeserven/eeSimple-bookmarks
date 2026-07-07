import type { ListSelection } from "../lib/useListSelection";
import type { LocationRelation } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { useLocationRelationColumns } from "./tables/locationRelationColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the location-relations listing, with an optional selection column in bulk-select mode. */
export function LocationRelationTable({
  locationRelations,
  selection,
}: {
  locationRelations: LocationRelation[];
  selection: ListSelection;
}) {
  const columns = useLocationRelationColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<LocationRelation>(selection, r => r.id)] : []),
        ...columns,
      ]}
      data={locationRelations}
      sortable
      onRowClick={(relation, event) =>
        rowNav(event, "location-relation", relation.id, () => {
          void navigate({
            to: "/taxonomies/location-relations/$locationRelationSlug/info",
            params: {
              locationRelationSlug: relation.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/location-relations/$locationRelationSlug/edit/general",
            params: {
              locationRelationSlug: relation.slug,
            },
          });
        })}
    />
  );
}
