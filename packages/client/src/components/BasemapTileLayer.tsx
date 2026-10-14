import { TileLayer } from "react-leaflet";

import { useConnectors } from "../hooks/useConnectors";

import { BORDERLESS_ATTRIBUTION, OSM_ATTRIBUTION, OSM_TILE_URL, cartoBorderlessTileUrl } from "@/lib/basemapTiles";

/**
 * The Locations map's base tile layer: standard OpenStreetMap, or CARTO's borderless "Positron"
 * style when administrative borders are hidden (OSM bakes borders into the tile images, so hiding
 * them means swapping the layer). The CARTO key configured in Settings → Connectors is read here,
 * which keeps the query off `LocationMap` itself. See `lib/basemapTiles.ts` for the key rationale.
 */
export function BasemapTileLayer({
  hideAdminBorders,
}: { hideAdminBorders: boolean }) {
  const {
    data,
  } = useConnectors();
  if (!hideAdminBorders) {
    return (
      <TileLayer
        attribution={OSM_ATTRIBUTION}
        url={OSM_TILE_URL}
      />
    );
  }
  return (
    <TileLayer
      attribution={BORDERLESS_ATTRIBUTION}
      url={cartoBorderlessTileUrl(data?.basemap.cartoApiKey)}
    />
  );
}
