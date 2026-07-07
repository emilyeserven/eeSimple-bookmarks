import type { LocationNode } from "@eesimple/types";
import type { Row } from "@tanstack/react-table";

import { placeTypeKey } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { TreeExpandToggle } from "./cells";
import i18n from "../../i18n";
import { placeTypeLabel } from "../../lib/locationLevels";
import { LocalizedNameLabel } from "../LocalizedNameLabel";

/** Name cell for the Locations table: indentation + expand toggle + map-pin icon + a detail link. */
export function LocationNameCell({
  row,
}: {
  row: Row<LocationNode>;
}) {
  return (
    <div
      className="flex items-center gap-1"
      style={{
        paddingLeft: `${row.depth * 1.25}rem`,
      }}
    >
      <TreeExpandToggle row={row} />
      <MapPin className="size-4 shrink-0 text-muted-foreground" />
      <Link
        to="/taxonomies/locations/$locationSlug/info"
        params={{
          locationSlug: row.original.slug,
        }}
        title={row.original.name}
        className="
          font-medium
          hover:underline
        "
      >
        <LocalizedNameLabel
          names={row.original.names ?? []}
          base={row.original.name}
        />
      </Link>
    </div>
  );
}

/** Place-type cell for the Locations table: the resolved level label, or an em dash when unset. */
export function LocationPlaceTypeCell({
  row,
}: {
  row: Row<LocationNode>;
}) {
  return (
    row.original.placeType
      ? <span className="text-sm">{placeTypeLabel(placeTypeKey(row.original.placeType))}</span>
      : <span className="text-sm text-muted-foreground">{i18n.t("—")}</span>
  );
}

/**
 * Location-relation cell for the Locations table: the distinct relations this location's bookmarks
 * express toward it (derived server-side), or an em dash when none.
 */
export function LocationRelationCell({
  row,
}: {
  row: Row<LocationNode>;
}) {
  const relations = row.original.locationRelations ?? [];
  return (
    relations.length > 0
      ? <span className="text-sm">{relations.map(relation => relation.name).join(", ")}</span>
      : <span className="text-sm text-muted-foreground">{i18n.t("—")}</span>
  );
}
