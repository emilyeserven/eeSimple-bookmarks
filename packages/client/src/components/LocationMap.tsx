import type { MapLayersDebug } from "../lib/locationMapDebug";
import type { LocationBoundary, LocationNode, PlaceTypeColorConfig, PlaceTypeDisplayConfig, PlaceTypeIconConfig } from "@eesimple/types";
import type { Feature, Geometry } from "geojson";
import type { LatLngTuple } from "leaflet";
import type { MutableRefObject, ReactNode } from "react";

import { useEffect, useRef, useState } from "react";

import {
  locationLacksLevel,
  NO_LEVEL_MAP_COLOR,
  NO_PLACE_TYPE_MAP_COLOR,
  resolveLocationColor,
  resolveLocationDisplay,
  resolveLocationIcon,
  resolveLocationPlaceTypeColor,
} from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { geoJSON, latLngBounds } from "leaflet";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

import { LocationMapDebugModal } from "./LocationMapDebugModal";
import { RomanizedLabel } from "./RomanizedLabel";
import { useMapPinScale, useMinAreaPinThresholdKm2 } from "../hooks/useAppSettings";
import { boundaryContainsPoint } from "../lib/locationGeo";
import { buildMapDebugInfo } from "../lib/locationMapDebug";
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
  /** Set when `color` is a needs-attention fallback rather than a user-chosen color. */
  colorReason?: "no-place-type" | "no-level";
}

/**
 * The color (and why) a node falls back to when neither a per-placeType override nor its level
 * group has an explicit color: flag a missing placeType or a placeType with no level at all, so
 * those "needs configuration" nodes stand out instead of blending into Leaflet's default blue.
 */
function fallbackColor(
  node: MappedNode,
  config: PlaceTypeDisplayConfig,
): { color: string;
  reason: "no-place-type" | "no-level"; } | null {
  if (node.placeType === null) {
    return {
      color: NO_PLACE_TYPE_MAP_COLOR,
      reason: "no-place-type",
    };
  }
  if (locationLacksLevel(node, config)) {
    return {
      color: NO_LEVEL_MAP_COLOR,
      reason: "no-level",
    };
  }
  return null;
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
  colorConfig: PlaceTypeColorConfig,
  minAreaKm2: number,
): RenderItem[] {
  const items: RenderItem[] = [];
  for (const node of mapped) {
    const resolved = resolveLocationDisplay(node, config, minAreaKm2);
    if (resolved === "hidden") continue;
    // Per-placeType override wins; else the level group's color; else a needs-attention fallback.
    const overrideColor = resolveLocationPlaceTypeColor(node, colorConfig) ?? resolveLocationColor(node, config);
    const fallback = overrideColor === null ? fallbackColor(node, config) : null;
    const color = overrideColor ?? fallback?.color ?? null;
    const icon = resolveLocationIcon(node, iconConfig);
    if (resolved === "area" && node.boundary) items.push({
      node,
      kind: "area",
      color,
      icon,
      colorReason: fallback?.reason,
    });
    else if (node.position) items.push({
      node,
      kind: "pin",
      color,
      icon,
      colorReason: fallback?.reason,
    });
    else if (node.boundary) items.push({
      node,
      kind: "area",
      color,
      icon,
      colorReason: fallback?.reason,
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

/** Standard OpenStreetMap raster tiles — renders country/state/prefecture administrative borders. */
const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = "© OpenStreetMap contributors";
/**
 * CARTO's "Positron" raster tiles — a lighter, non-obtrusive basemap style that omits administrative
 * boundary lines. Used when the "hide borders" option is on, since the OSM standard style bakes
 * country/prefecture/state borders into the tile images themselves (nothing our own GeoJSON layers
 * draw), so hiding them means swapping the whole base tile layer rather than toggling a feature.
 */
const BORDERLESS_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const BORDERLESS_ATTRIBUTION = "© OpenStreetMap contributors © CARTO";

/** A map viewport (center + zoom) persisted across this map's remounts to seed the next one. */
export interface MapView {
  center: LatLngTuple;
  zoom: number;
}

/**
 * Imperatively frame the map to every rendered item (polygon bounds + point markers). The very first
 * fit of a map with no seeded base (cold load) snaps instantly; once a base exists — i.e. the fresh
 * container was seeded from the previous location's view — the camera **animates** (`flyToBounds`)
 * into the new bounds, so navigating up a level eases out and down a level eases in. Later refits in
 * the same instance (a boundary backfills, a level toggles) animate too.
 */
function FitBounds({
  items, hadBase,
}: {
  items: RenderItem[];
  hadBase: boolean;
}) {
  const map = useMap();
  // Re-fit whenever the set of rendered items changes (e.g. a boundary backfills in, or a level toggles).
  const signature = items.map(i => `${i.node.id}:${i.kind}`).join("|");
  // Read the latest items inside the effect so an unrelated re-render can't restart the animation;
  // only the stable `signature` (and `hadBase`) drive a refit.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const firstRunRef = useRef(true);
  useEffect(() => {
    const bounds = latLngBounds([]);
    for (const {
      node, kind,
    } of itemsRef.current) {
      if (kind === "area" && node.boundary) bounds.extend(geoJSON(toFeature(node.boundary)).getBounds());
      else if (node.position) bounds.extend(node.position);
      else if (node.boundary) bounds.extend(geoJSON(toFeature(node.boundary)).getBounds());
    }
    if (!bounds.isValid()) return;
    const isFirst = firstRunRef.current;
    firstRunRef.current = false;
    // Snap only on a baseless first fit (cold load); otherwise animate from the seeded/previous view.
    if (isFirst && !hadBase) {
      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 12,
      });
    }
    else {
      map.flyToBounds(bounds, {
        padding: [40, 40],
        maxZoom: 12,
        duration: 0.8,
      });
    }
  }, [map, signature, hadBase]);
  return null;
}

/** Record the map's settled viewport into the parent-held ref so the next remount can seed from it. */
function ViewportRecorder({
  viewRef,
}: {
  viewRef: MutableRefObject<MapView | null>;
}) {
  const map = useMap();
  function remember(): void {
    const center = map.getCenter();
    viewRef.current = {
      center: [center.lat, center.lng],
      zoom: map.getZoom(),
    };
  }
  useMapEvents({
    moveend: remember,
    zoomend: remember,
  });
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
  /**
   * Per-placeType map color overrides (Settings → Locations "Pin Style"). A color keyed here wins over
   * the place type's level-group color for its pins/areas. Defaults to `{}` (use the group color).
   */
  colorConfig?: PlaceTypeColorConfig;
  /**
   * An element rendered as an absolutely-positioned overlay inside the map (top-right corner).
   * Pointer events on the rest of the map area are preserved via `pointer-events-none` on the
   * overlay wrapper; the passed element itself must handle its own pointer events. Hidden below
   * the `md` breakpoint — on mobile the trigger lives outside the map instead (see
   * `LocationMapSection`'s `md:hidden` header button), since a persistent panel drawn over a
   * narrow map crowds out the map itself.
   */
  overlay?: ReactNode;
  /**
   * A ref held by the (non-remounting) parent carrying the previous map's settled viewport. The
   * freshly-mounted container seeds its initial center/zoom from it (so navigation opens framed on
   * the previous location instead of the world view) and animates into the new bounds; this map then
   * keeps it up to date as the user pans/zooms. Omit on maps that don't navigate (no continuity).
   */
  lastViewRef?: MutableRefObject<MapView | null>;
  /**
   * Hide the base map tiles' own country/prefecture/state administrative border lines by switching to
   * a borderless tile style (Settings → Locations / the map "Levels" overlay). Defaults to `false`
   * (the standard OpenStreetMap style, which draws these borders).
   */
  hideAdminBorders?: boolean;
  /**
   * The "Levels" overlay state (visibility/disabled/populated per level group + mode/filter), captured
   * by {@link LocationMapSection}. `LocationMap` can't introspect the opaque `overlay` node, so the
   * section threads this in purely to enrich the debug modal. Omit on maps without a Levels overlay.
   */
  layersDebug?: MapLayersDebug | null;
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
  colorConfig = {},
  overlay,
  lastViewRef,
  hideAdminBorders = false,
  layersDebug = null,
}: LocationMapProps) {
  const minAreaKm2 = useMinAreaPinThresholdKm2();
  const pinScale = useMapPinScale();
  const mapped = collectMapped(tree);
  const items = toRenderItems(mapped, displayConfig, iconConfig, colorConfig, minAreaKm2);
  const areaNodes = items.filter(item => item.kind === "area" && item.node.boundary).map(item => item.node);
  const omitted = countNodes(tree) - mapped.length;
  const hiddenByLevel = mapped.length - items.length;
  const noPlaceTypeCount = items.filter(item => item.colorReason === "no-place-type").length;
  const noLevelCount = items.filter(item => item.colorReason === "no-level").length;

  // Frozen at this instance's mount: the previous map's view (or null on a cold load). Seeds the
  // container's initial viewport and tells FitBounds whether to animate in or snap.
  const seedRef = useRef(lastViewRef?.current ?? null);
  const hadBase = seedRef.current !== null;
  const center: LatLngTuple = seedRef.current?.center ?? [20, 0];
  const zoom = seedRef.current?.zoom ?? 2;

  const debugInfo = buildMapDebugInfo({
    tree,
    displayConfig,
    iconConfig,
    colorConfig,
    minAreaKm2,
    pinScale,
    hideAdminBorders,
    className,
    seedView: seedRef.current
      ? {
        center: [seedRef.current.center[0], seedRef.current.center[1]],
        zoom: seedRef.current.zoom,
      }
      : null,
    layers: layersDebug,
  });

  if (mapped.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground">
          No locations have coordinates yet. Add one via a location’s geocoding lookup to place it on
          the map.
        </p>
        <LocationMapDebugModal debug={debugInfo} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative isolate">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom
          className={cn("isolate", className)}
        >
          <TileLayer
            attribution={hideAdminBorders ? BORDERLESS_ATTRIBUTION : OSM_ATTRIBUTION}
            url={hideAdminBorders ? BORDERLESS_TILE_URL : OSM_TILE_URL}
          />
          <FitBounds
            items={items}
            hadBase={hadBase}
          />
          {lastViewRef ? <ViewportRecorder viewRef={lastViewRef} /> : null}
          <AreaClickPopup items={items} />
          {items.map(({
            node, kind, color, icon,
          }) => (
            kind === "area" && node.boundary
              ? (
                <GeoJSON
                  key={`${node.id}:${color ?? ""}:${JSON.stringify(node.boundary)}`}
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
                    icon={markerIconFor(color, icon, pinScale)}
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
        {overlay
          ? (
            <div
              className="
                pointer-events-none absolute inset-0 z-1000 hidden
                md:block
              "
            >
              <div className="pointer-events-auto absolute top-2 right-2">
                {overlay}
              </div>
            </div>
          )
          : null}
      </div>
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
      {noPlaceTypeCount > 0
        ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: NO_PLACE_TYPE_MAP_COLOR,
              }}
              aria-hidden="true"
            />
            {noPlaceTypeCount}
            {noPlaceTypeCount === 1 ? " location has" : " locations have"}
            {" "}
            no place type.
          </p>
        )
        : null}
      {noLevelCount > 0
        ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: NO_LEVEL_MAP_COLOR,
              }}
              aria-hidden="true"
            />
            {noLevelCount}
            {noLevelCount === 1 ? " location has" : " locations have"}
            {" "}
            a place type with no level.
          </p>
        )
        : null}
      <div className="flex justify-end">
        <LocationMapDebugModal debug={debugInfo} />
      </div>
    </div>
  );
}
