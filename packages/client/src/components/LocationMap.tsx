import type { LocationBoundary, LocationNode, PlaceTypeDisplayConfig } from "@eesimple/types";
import type { Feature, Geometry } from "geojson";
import type { LatLngTuple } from "leaflet";

import { useEffect } from "react";

import { resolveLocationDisplay } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { Icon, geoJSON, latLngBounds } from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import { RomanizedLabel } from "./RomanizedLabel";

import { cn } from "@/lib/utils";

import "leaflet/dist/leaflet.css";

/**
 * Leaflet ships its default marker as CSS background images resolved by relative URL, which a
 * bundler (Vite) rewrites and breaks. Build the icon explicitly from the bundled asset URLs so
 * markers render everywhere. One shared instance — markers are otherwise identical.
 */
const DEFAULT_MARKER = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/** A location reduced to the fields the map needs: an area outline, a point, or both. */
interface MappedNode {
  id: string;
  name: string;
  romanizedName: string | null | undefined;
  slug: string;
  /** Loose place classification, used to resolve the per-level display config. */
  placeType: string | null;
  /** A point coordinate, when known. */
  position: LatLngTuple | null;
  /** A GeoJSON area outline, when known (preferred over the point for rendering). */
  boundary: LocationBoundary | null;
}

/** Depth-first flatten of the location tree to every node that can be placed (point and/or area). */
function collectMapped(nodes: LocationNode[]): MappedNode[] {
  return nodes.flatMap((node) => {
    const position: LatLngTuple | null = node.latitude != null && node.longitude != null
      ? [node.latitude, node.longitude]
      : null;
    const boundary = node.boundary ?? null;
    const here: MappedNode[] = position !== null || boundary !== null
      ? [{
        id: node.id,
        name: node.name,
        romanizedName: node.romanizedName,
        slug: node.slug,
        placeType: node.placeType,
        position,
        boundary,
      }]
      : [];
    return [...here, ...collectMapped(node.children)];
  });
}

/** How a single mapped node should be drawn once the per-level config is applied. */
interface RenderItem {
  node: MappedNode;
  kind: "area" | "pin";
}

/**
 * Apply the per-placeType display config to the placed nodes: drop hidden levels, and for each
 * survivor decide an area (polygon) or pin (marker) rendering, falling back to whatever geometry is
 * actually available (a "pin" with only a boundary still draws the area; an "area" with no boundary
 * draws a pin — already handled by `resolveLocationDisplay`).
 */
function toRenderItems(mapped: MappedNode[], config: PlaceTypeDisplayConfig): RenderItem[] {
  const items: RenderItem[] = [];
  for (const node of mapped) {
    const resolved = resolveLocationDisplay(node, config);
    if (resolved === "hidden") continue;
    if (resolved === "area" && node.boundary) items.push({
      node,
      kind: "area",
    });
    else if (node.position) items.push({
      node,
      kind: "pin",
    });
    else if (node.boundary) items.push({
      node,
      kind: "area",
    });
  }
  return items;
}

/** Count every node in the tree, regardless of whether it can be placed. */
function countNodes(nodes: LocationNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);
}

/** Wrap a stored boundary geometry as a GeoJSON Feature for Leaflet's GeoJSON layer. */
function toFeature(boundary: LocationBoundary): Feature {
  return {
    type: "Feature",
    geometry: boundary as Geometry,
    properties: {},
  };
}

/** Imperatively fit the map to every rendered item (polygon bounds + point markers) once they load. */
function FitBounds({
  items,
}: {
  items: RenderItem[];
}) {
  const map = useMap();
  // Re-fit whenever the set of rendered items changes (e.g. a boundary backfills in, or a level toggles).
  const signature = items.map(i => `${i.node.id}:${i.kind}`).join("|");
  useEffect(() => {
    const bounds = latLngBounds([]);
    for (const {
      node, kind,
    } of items) {
      if (kind === "area" && node.boundary) bounds.extend(geoJSON(toFeature(node.boundary)).getBounds());
      else if (node.position) bounds.extend(node.position);
      else if (node.boundary) bounds.extend(geoJSON(toFeature(node.boundary)).getBounds());
    }
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 12,
      });
    }
  }, [map, signature, items]);
  return null;
}

/** A name link shared by marker popups and polygon popups. */
function NodePopupLink({
  node,
}: {
  node: MappedNode;
}) {
  return (
    <Popup>
      <Link
        to="/taxonomies/locations/$locationSlug"
        params={{
          locationSlug: node.slug,
        }}
        className="
          font-medium
          hover:underline
        "
      >
        <RomanizedLabel
          name={node.name}
          romanized={node.romanizedName}
        />
      </Link>
    </Popup>
  );
}

interface LocationMapProps {
  /** The location tree (or sub-tree) to plot; nodes without a point or area are silently skipped. */
  tree: LocationNode[];
  /** Extra classes for the map container (size/height). Defaults to a tall listing-style map. */
  className?: string;
  /**
   * Per-placeType display config (Settings → Locations / the map "Levels" overlay). Decides, per
   * place type, pin-vs-area rendering and whether that level shows at all. Defaults to `{}` (every
   * level visible, legacy area-or-pin rendering).
   */
  displayConfig?: PlaceTypeDisplayConfig;
}

/**
 * Map for the Locations taxonomy. Each location renders as its **area polygon** or a **pin** per the
 * per-placeType display config (a place type can be set to always-pin, or hidden entirely); both
 * link to the location's detail page. Nodes with neither a coordinate nor a boundary are omitted,
 * and nodes hidden by their level are noted separately.
 */
export function LocationMap({
  tree,
  className = "h-[70vh] w-full rounded-lg border",
  displayConfig = {},
}: LocationMapProps) {
  const mapped = collectMapped(tree);
  const items = toRenderItems(mapped, displayConfig);
  const omitted = countNodes(tree) - mapped.length;
  const hiddenByLevel = mapped.length - items.length;

  if (mapped.length === 0) {
    return (
      <p className="text-muted-foreground">
        No locations have coordinates yet. Add one via a location’s geocoding lookup to place it on
        the map.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom
        className={cn("isolate", className)}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds items={items} />
        {items.map(({
          node, kind,
        }) => (
          kind === "area" && node.boundary
            ? (
              <GeoJSON
                key={node.id}
                data={toFeature(node.boundary)}
              >
                <NodePopupLink node={node} />
              </GeoJSON>
            )
            : node.position
              ? (
                <Marker
                  key={node.id}
                  position={node.position}
                  icon={DEFAULT_MARKER}
                >
                  <NodePopupLink node={node} />
                </Marker>
              )
              : null
        ))}
      </MapContainer>
      {omitted > 0
        ? (
          <p className="text-xs text-muted-foreground">
            {omitted}
            {omitted === 1 ? " location has" : " locations have"}
            {" "}
            no coordinates and {omitted === 1 ? "isn’t" : "aren’t"} shown.
          </p>
        )
        : null}
      {hiddenByLevel > 0
        ? (
          <p className="text-xs text-muted-foreground">
            {hiddenByLevel}
            {hiddenByLevel === 1 ? " location is" : " locations are"}
            {" "}
            hidden by the current level filter.
          </p>
        )
        : null}
    </div>
  );
}
