import type { LocationBoundary } from "@eesimple/types";

/**
 * Even-odd ray casting against a single GeoJSON ring of `[lng, lat]` points. Returns whether the
 * point lies within the ring (winding direction is irrelevant for the even-odd rule).
 */
function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = (yi > lat) !== (yj > lat)
      && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/**
 * A point is in a GeoJSON polygon when it is inside the outer ring (`rings[0]`) and outside every
 * hole ring (`rings[1..]`).
 */
function pointInPolygon(lng: number, lat: number, rings: number[][][]): boolean {
  if (rings.length === 0 || !pointInRing(lng, lat, rings[0])) return false;
  for (let k = 1; k < rings.length; k++) {
    if (pointInRing(lng, lat, rings[k])) return false;
  }
  return true;
}

/**
 * Whether the `[lng, lat]` point falls inside a stored location boundary. Coordinates are GeoJSON
 * order (`[lng, lat]`); Leaflet's `LatLng` is `{lat, lng}`, so callers must pass `latlng.lng` /
 * `latlng.lat`.
 */
export function boundaryContainsPoint(lng: number, lat: number, boundary: LocationBoundary): boolean {
  return boundary.type === "Polygon"
    ? pointInPolygon(lng, lat, boundary.coordinates as number[][][])
    : (boundary.coordinates as number[][][][]).some(poly => pointInPolygon(lng, lat, poly));
}
