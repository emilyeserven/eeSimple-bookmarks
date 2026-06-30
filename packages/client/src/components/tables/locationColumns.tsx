import type { LocationNode } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { placeTypeKey } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { TreeExpandToggle } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import { useSidebarOpenModifier } from "../../hooks/useAppSettings";
import { placeTypeLabel } from "../../lib/locationLevels";
import { useViewPanelClick } from "../panel/useEditPanelClick";
import { RomanizedLabel } from "../RomanizedLabel";

import { entityLinkTitle } from "@/lib/sidebarModifier";

/** Column definitions for the Locations listing Table view (a flattened, expandable tree). */
export function useLocationColumns(): ColumnDef<LocationNode>[] {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  return useMemo(
    () => [
      {
        id: "name",
        header: "Name",
        cell: ({
          row,
        }) => (
          <div
            className="flex items-center gap-1"
            style={{
              paddingLeft: `${row.depth * 1.25}rem`,
            }}
          >
            <TreeExpandToggle row={row} />
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <Link
              to="/taxonomies/locations/$locationSlug/general"
              params={{
                locationSlug: row.original.slug,
              }}
              title={entityLinkTitle(modifier)}
              onClick={event => viewClick(event, "location", row.original.id, row.original.slug)}
              className="
                font-medium
                hover:underline
              "
            >
              <RomanizedLabel
                name={row.original.name}
                romanized={row.original.romanizedName}
              />
            </Link>
          </div>
        ),
      },
      {
        id: "placeType",
        header: "Place type",
        cell: ({
          row,
        }) => (
          row.original.placeType
            ? <span className="text-sm">{placeTypeLabel(placeTypeKey(row.original.placeType))}</span>
            : <span className="text-sm text-muted-foreground">—</span>
        ),
      },
      bookmarkCountColumn<LocationNode>(),
    ],
    [viewClick, modifier],
  );
}
