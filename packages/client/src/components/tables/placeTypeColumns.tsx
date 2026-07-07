import type { PlaceType } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { placeTypeKey } from "@eesimple/types";
import { Shapes } from "lucide-react";

import { EditActionCell } from "./cells";
import { useLocationLevels } from "../../hooks/useLocationLevels";
import i18n from "../../i18n";

import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/lib/icons";

/** Column definitions for the Place Types listing Table view. */
export function usePlaceTypeColumns(): ColumnDef<PlaceType>[] {
  const {
    groups, placeTypeIcons,
  } = useLocationLevels({
    notify: false,
  });
  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: i18n.t("Name"),
        cell: ({
          row,
        }) => {
          // Same Pin/Area split as `PlaceTypeListItem`: pin-mode place types show their configured
          // (or default) pin icon; area-mode / unassigned ones show a generic area icon.
          const key = placeTypeKey(row.original.slug);
          const isPinType = groups.some(
            group => group.displayMode === "pin" && group.placeTypes.includes(key),
          );
          return (
            <div className="flex items-center gap-2 font-medium">
              {isPinType
                ? (
                  <CategoryIcon
                    name={placeTypeIcons[key] ?? "MapPin"}
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                )
                : <Shapes className="size-4 shrink-0 text-muted-foreground" />}
              {row.original.name}
            </div>
          );
        },
      },
      {
        accessorKey: "locationCount",
        header: i18n.t("Locations"),
        cell: ({
          row,
        }) => <Badge variant="secondary">{row.original.locationCount}</Badge>,
      },
      {
        accessorKey: "createdAt",
        header: i18n.t("Created"),
        cell: ({
          row,
        }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <EditActionCell
            to="/taxonomies/place-types/$placeTypeSlug/edit/general"
            params={{
              placeTypeSlug: row.original.slug,
            }}
            label={i18n.t("Edit {{name}}", {
              name: row.original.name,
            })}
          />
        ),
      },
    ],
    [groups, placeTypeIcons],
  );
}
