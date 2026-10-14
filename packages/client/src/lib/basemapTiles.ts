/**
 * Base tile layers for the Locations map, and the CARTO API-key plumbing.
 *
 * Two raster basemaps are used. The default is standard OpenStreetMap; the borderless style (the
 * map's "hide administrative borders" option) is CARTO "Positron", because OSM bakes
 * country/prefecture/state borders into the tile images themselves — hiding them means swapping the
 * whole base layer rather than toggling a feature.
 *
 * CARTO enforces an API key on `basemaps.cartocdn.com`: unkeyed requests are served tiles stamped
 * with an "API KEY REQUIRED" watermark. A free key (fair-use limited) comes from
 * https://carto.com/basemaps/apikey/ and is configured in Settings → Connectors; it reaches the
 * browser via `GET /api/connectors` because Leaflet fetches the tiles itself. With no key stored
 * the URL is left untouched and CARTO still serves the (watermarked) tiles, so the option keeps
 * working out of the box.
 */

/** Standard OpenStreetMap raster tiles — renders country/state/prefecture administrative borders. */
export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION = "© OpenStreetMap contributors";

/** CARTO "Positron" raster tiles — a lighter basemap style that omits administrative boundary lines. */
export const BORDERLESS_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
export const BORDERLESS_ATTRIBUTION = "© OpenStreetMap contributors © CARTO";

/**
 * The borderless (CARTO) tile URL with the configured API key appended as CARTO's `?key=` query
 * parameter. A missing or blank key returns the bare template unchanged — CARTO still serves those
 * tiles, just watermarked.
 */
export function cartoBorderlessTileUrl(apiKey: string | null | undefined): string {
  const key = apiKey?.trim();
  if (!key) return BORDERLESS_TILE_URL;
  return `${BORDERLESS_TILE_URL}?key=${encodeURIComponent(key)}`;
}
