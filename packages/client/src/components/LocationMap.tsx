import type { LocationBoundary, LocationNode, PlaceTypeDisplayConfig, PlaceTypeIconConfig } from "@eesimple/types";
import type { Feature, Geometry } from "geojson";
import type { LatLngTuple } from "leaflet";

import { useEffect, useState } from "react";

import { resolveLocationColor, resolveLocationDisplay, resolveLocationIcon } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { geoJSON, latLngBounds } from "leaflet";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

import { RomanizedLabel } from "./RomanizedLabel";
import { boundaryContainsPoint } from "../lib/locationGeo";
import { markerIconFor } from "../lib/locationMapMarkers";

import { cn } from "@/lib/utils";

import "leaflet/dist/leaflet.css";

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
  /** The level's custom map color, or `null` to fall back to Leaflet's default blue. */
  color: string | null;
  /** The place type's custom pin icon (a Lucide name), or `null` for a plain pin. */
  icon: string | null;
}

/**
 * Apply the per-placeType display config to the placed nodes: drop hidden levels, and for each
 * survivor decide an area (polygon) or pin (marker) rendering, falling back to whatever geometry is
 * actually available (a "pin" with only a boundary still draws the area; an "area" with no boundary
 * draws a pin — already handled by `resolveLocationDisplay`).
 */
function toRenderItems(
  mapped: MappedNode[],
  config: PlaceTypeDisplayConfig,
  iconConfig: PlaceTypeIconConfig,
): RenderItem[] {
  const items: RenderItem[] = [];
  for (const node of mapped) {
    const resolved = resolveLocationDisplay(node, config);
    if (resolved === "hidden") continue;
    const color = resolveLocationColor(node, config);
    const icon = resolveLocationIcon(node, iconConfig);
    if (resolved === "area" && node.boundary) items.push({
      node,
      kind: "area",
      color,
      icon,
    });
    else if (node.position) items.push({
      node,
      kind: "pin",
      color,
      icon,
    });
    else if (node.boundary) items.push({
      node,
      kind: "area",
      color,
      icon,
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

/** A single location name link to its detail page, shared by marker and area popups. */
function NodeLink({
  node,
}: {
  node: MappedNode;
}) {
  return (
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
  );
}

/**
 * Marker popup: the pin's own link plus the areas it falls inside ("part of"). A pin is a point, so
 * unlike overlapping polygons it can't be found by the map-level area handler — instead we test the
 * pin's coordinate against every rendered area boundary and list the containing ones here.
 */
function PinPopup({
  node, areas,
}: {
  node: MappedNode;
  areas: MappedNode[];
}) {
  const [lat, lng] = node.position ?? [0, 0];
  const containing = node.position === null
    ? []
    : areas.filter(area => area.id !== node.id && area.boundary
      && boundaryContainsPoint(lng, lat, area.boundary));
  return (
    <Popup>
      <div className="space-y-1">
        <NodeLink node={node} />
        {containing.length > 0
          ? (
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Part of</p>
              <ul className="space-y-0.5">
                {containing.map(area => (
                  <li key={area.id}>
                    <NodeLink node={area} />
                  </li>
                ))}
              </ul>
            </div>
          )
          : null}
      </div>
    </Popup>
  );
}

/** The click point plus every area whose boundary contains it. */
interface AreaHit {
  position: LatLngTuple;
  nodes: MappedNode[];
}

/**
 * A map-level click handler that owns area popups. Clicks on vector layers bubble to the map
 * (`bubblingMouseEvents` defaults to true), so one handler covers every polygon: it finds **all**
 * areas containing the click point — not just the topmost layer — and opens a single popup listing
 * them. Clicking where no area matches closes the popup. Markers keep their own popups.
 */
function AreaClickPopup({
  items,
}: {
  items: RenderItem[];
}) {
  const [hit, setHit] = useState<AreaHit | null>(null);
  useMapEvents({
    click(event) {
      const {
        lat, lng,
      } = event.latlng;
      const nodes = items
        .filter(item => item.kind === "area" && item.node.boundary
          && boundaryContainsPoint(lng, lat, item.node.boundary))
        .map(item => item.node);
      setHit(nodes.length > 0
        ? {
          position: [lat, lng],
          nodes,
        }
        : null);
    },
  });
  if (hit === null) return null;
  return (
    <Popup position={hit.position}>
      {hit.nodes.length > 1
        ? (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Areas here</p>
            <ul className="space-y-0.5">
              {hit.nodes.map(node => (
                <li key={node.id}>
                  <NodeLink node={node} />
                </li>
              ))}
            </ul>
          </div>
        )
        : <NodeLink node={hit.nodes[0]} />}
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
  /**
   * Per-placeType map-pin icon overrides (Settings → Locations "Place Type Icons"). A Lucide icon
   * keyed here is drawn inside that place type's pin. Defaults to `{}` (plain pins).
   */
  iconConfig?: PlaceTypeIconConfig;
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
  iconConfig = {},
}: LocationMapProps) {
  const mapped = collectMapped(tree);
  const items = toRenderItems(mapped, displayConfig, iconConfig);
  const areaNodes = items.filter(item => item.kind === "area" && item.node.boundary).map(item => item.node);
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
        <AreaClickPopup items={items} />
        {items.map(({
          node, kind, color, icon,
        }) => (
          kind === "area" && node.boundary
            ? (
              <GeoJSON
                key={color === null ? node.id : `${node.id}:${color}`}
                data={toFeature(node.boundary)}
                style={color === null
                  ? undefined
                  : {
                    color,
                    fillColor: color,
                  }}
              />
            )
            : node.position
              ? (
                <Marker
                  key={node.id}
                  position={node.position}
                  icon={markerIconFor(color, icon)}
                >
                  <PinPopup
                    node={node}
                    areas={areaNodes}
                  />
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
