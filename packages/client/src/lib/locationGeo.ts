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

/** Signed area and area-weighted centroid of a single ring, in `[lng, lat]` degree units. */
function ringCentroid(ring: number[][]): { area: number;
  cx: number;
  cy: number; } {
  let signedArea = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[(i + 1) % ring.length];
    const cross = x0 * y1 - x1 * y0;
    signedArea += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  const area = signedArea / 2;
  if (area === 0) return {
    area: 0,
    cx: ring[0]?.[0] ?? 0,
    cy: ring[0]?.[1] ?? 0,
  };
  return {
    area: Math.abs(area),
    cx: cx / (6 * area),
    cy: cy / (6 * area),
  };
}

/** Centroid of a single GeoJSON polygon's outer ring (holes ignored — fine for pin placement). */
function polygonCentroid(rings: number[][][]): { area: number;
  cx: number;
  cy: number; } {
  if (rings.length === 0 || rings[0].length === 0) return {
    area: 0,
    cx: 0,
    cy: 0,
  };
  return ringCentroid(rings[0]);
}

/**
 * A representative point for a boundary with no separately-stored coordinate, used to place a pin
 * for a location that's been downgraded from "area" to "pin" (e.g. by `minAreaKm2`) but only has a
 * boundary on file. Returns `[lat, lng]` (Leaflet order) — the area-weighted centroid of a Polygon,
 * or of a MultiPolygon's constituent polygons. `null` only for a degenerate (zero-area) boundary.
 */
export function boundaryCentroid(boundary: LocationBoundary): [number, number] | null {
  if (boundary.type === "Polygon") {
    const {
      area, cx, cy,
    } = polygonCentroid(boundary.coordinates as number[][][]);
    return area === 0 ? null : [cy, cx];
  }
  let totalArea = 0;
  let sumX = 0;
  let sumY = 0;
  for (const poly of boundary.coordinates as number[][][][]) {
    const {
      area, cx, cy,
    } = polygonCentroid(poly);
    totalArea += area;
    sumX += cx * area;
    sumY += cy * area;
  }
  return totalArea === 0 ? null : [sumY / totalArea, sumX / totalArea];
}
