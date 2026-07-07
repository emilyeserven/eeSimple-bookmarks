import type { ListSelection } from "../lib/useListSelection";
import type { PlaceType } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { usePlaceTypeColumns } from "./tables/placeTypeColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";

import { DataTable } from "@/components/ui/data-table";

/** Table view of the place-types listing, with an optional selection column in bulk-select mode. */
export function PlaceTypeTable({
  placeTypes,
  selection,
}: {
  placeTypes: PlaceType[];
  selection: ListSelection;
}) {
  const placeTypeColumns = usePlaceTypeColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  return (
    <DataTable
      columns={[
        ...(selection.mode ? [listingSelectionColumn<PlaceType>(selection, pt => pt.id)] : []),
        ...placeTypeColumns,
      ]}
      data={placeTypes}
      sortable
      onRowClick={(placeType, event) =>
        rowNav(event, () => {
          void navigate({
            to: "/taxonomies/place-types/$placeTypeSlug/info",
            params: {
              placeTypeSlug: placeType.slug,
            },
          });
        }, () => {
          void navigate({
            to: "/taxonomies/place-types/$placeTypeSlug/edit/general",
            params: {
              placeTypeSlug: placeType.slug,
            },
          });
        })}
    />
  );
}
