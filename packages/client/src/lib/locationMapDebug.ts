import type {
  LocationBoundary,
  LocationNode,
  PlaceTypeColorConfig,
  PlaceTypeDisplayConfig,
  PlaceTypeIconConfig,
  PlaceTypeLevelGroup,
} from "@eesimple/types";

import {
  boundaryAreaKm2,
  locationLacksLevel,
  NO_LEVEL_MAP_COLOR,
  NO_PLACE_TYPE_MAP_COLOR,
  placeTypeKey,
  resolveLocationColor,
  resolveLocationDisplay,
  resolveLocationIcon,
  resolveLocationPlaceTypeColor,
} from "@eesimple/types";

import { flattenTree } from "./tagTree";

/**
 * A snapshot of the map viewport (center + zoom) the map seeded from, or `null` on a cold load.
 * Kept structurally compatible with `LocationMap`'s `MapView` without importing the component (a
 * lib→component type import would be a needless dependency cycle).
 */
export interface DebugMapView {
  center: number[];
  zoom: number;
}

/**
 * The "Levels" (a.k.a. Layers) overlay state, captured by `LocationMapSection` and threaded into the
 * debug payload so the modal can explain per-level visibility. `LocationMap` itself never sees the
 * overlay (it's passed as an opaque `ReactNode`), so the section supplies this.
 */
export interface MapLayersDebug {
  /** How the map picks default-visible levels: `main` / `location` / `bookmark`. */
  scopeKind: string;
  /** The shared above/current/below expansion mode, or `null` on maps without a current level. */
  levelMode: string | null;
  /** Whether the borderless base-tile style is active. */
  hideAdminBorders: boolean;
  /** Location ids the map is focused on (empty = show all). */
  filterIds: string[];
  /** The "only direct ancestors/children" toggle, or `null` when the map has no such control. */
  onlyDirectRelatives: boolean | null;
  /** Every configured level group with its resolved per-map visibility state. */
  groups: MapLayerGroupDebug[];
}

/** One level group's config plus this map's resolved checkbox state for it. */
export interface MapLayerGroupDebug {
  id: string;
  name: string;
  sortOrder: number;
  displayMode: string;
  color: string | null;
  placeTypes: string[];
  /** Checkbox is on (the group's levels are shown). */
  visible: boolean;
  /** Checkbox is disabled (no plotted node of this level on the current tree). */
  disabled: boolean;
  /** The group has at least one plotted node (or plotted descendant) on the current tree. */
  populated: boolean;
}

/** The per-map "Levels" overlay state {@link buildLayersDebug} snapshots for the debug payload. */
export interface LayersDebugInput {
  scopeKind: string;
  levelMode: string | null;
  hideAdminBorders: boolean;
  filterIds: string[];
  onlyDirectRelatives: boolean | null;
  groups: PlaceTypeLevelGroup[];
  /** Group ids currently shown on this map. */
  visibleIds: Set<string>;
  /** Group ids whose checkbox is disabled (no plotted node of that level). */
  disabledIds: Set<string>;
  /** Group ids with at least one plotted node (or descendant) on the current tree. */
  populatedIds: Set<string>;
}

/**
 * Fold the `LocationMapSection` level state into the flat {@link MapLayersDebug} the modal renders.
 * Kept out of the component so its resolved-per-group `.map`/`??` logic doesn't add to that already
 * hook-dense component's cognitive load (see the decomposition note in CLAUDE.md). Pure — unit-tested.
 */
export function buildLayersDebug(input: LayersDebugInput): MapLayersDebug {
  return {
    scopeKind: input.scopeKind,
    levelMode: input.levelMode,
    hideAdminBorders: input.hideAdminBorders,
    filterIds: input.filterIds,
    onlyDirectRelatives: input.onlyDirectRelatives,
    groups: input.groups.map(group => ({
      id: group.id,
      name: group.name,
      sortOrder: group.sortOrder,
      displayMode: group.displayMode,
      color: group.color ?? null,
      placeTypes: group.placeTypes,
      visible: input.visibleIds.has(group.id),
      disabled: input.disabledIds.has(group.id),
      populated: input.populatedIds.has(group.id),
    })),
  };
}

/** The reason a node is not drawn, or `null` when it is rendered. */
export type NodeHiddenReason = "no-geometry" | "hidden-by-level";

/** Per-node diagnostic explaining whether — and how — a single location is drawn. */
export interface MapNodeDebug {
  id: string;
  name: string;
  slug: string;
  depth: number;
  placeType: string | null;
  /** Normalized place-type key used to look up display config / colors. */
  placeTypeKey: string;
  latitude: number | null;
  longitude: number | null;
  hasCoordinates: boolean;
  hasBoundary: boolean;
  boundaryType: string | null;
  boundaryAreaKm2: number | null;
  /** `true` when the node is drawn on the map. */
  rendered: boolean;
  /** Why it isn't drawn (`null` when rendered). */
  hiddenReason: NodeHiddenReason | null;
  /** How it's drawn (`null` when not rendered). */
  renderKind: "area" | "pin" | null;
  /** The resolved fill/stroke color, or `null` for Leaflet's default blue. */
  color: string | null;
  /** Set when `color` is a needs-attention fallback rather than a chosen color. */
  colorReason: "no-place-type" | "no-level" | null;
  /** The resolved Lucide pin icon, or `null` for a plain pin. */
  icon: string | null;
}

/** The full copy/paste-ready debug payload for one rendered map. */
export interface MapDebugInfo {
  props: {
    className: string;
    hideAdminBorders: boolean;
    displayConfig: PlaceTypeDisplayConfig;
    iconConfig: PlaceTypeIconConfig;
    colorConfig: PlaceTypeColorConfig;
  };
  settings: {
    minAreaKm2: number;
    pinScale: number;
  };
  viewport: {
    seededFromPreviousView: boolean;
    center: number[];
    zoom: number;
  };
  summary: {
    totalNodes: number;
    withCoordinates: number;
    withBoundary: number;
    rendered: number;
    renderedAreas: number;
    renderedPins: number;
    omittedNoGeometry: number;
    hiddenByLevel: number;
    noPlaceType: number;
    noLevel: number;
  };
  layers: MapLayersDebug | null;
  nodes: MapNodeDebug[];
}

/** Inputs mirroring what `LocationMap` renders from, plus the overlay state from its section. */
export interface MapDebugInput {
  tree: LocationNode[];
  displayConfig: PlaceTypeDisplayConfig;
  iconConfig: PlaceTypeIconConfig;
  colorConfig: PlaceTypeColorConfig;
  minAreaKm2: number;
  pinScale: number;
  hideAdminBorders: boolean;
  className: string;
  seedView: DebugMapView | null;
  layers?: MapLayersDebug | null;
}

/**
 * The fallback color (and why) a node falls back to when it has no chosen color — mirrors the private
 * `fallbackColor` in `LocationMap` so the diagnostic matches what the map actually draws.
 */
function fallbackColor(
  node: { placeType: string | null },
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

/** Classify one flattened node exactly as `LocationMap`'s `toRenderItems` would. */
function describeNode(
  node: LocationNode,
  depth: number,
  input: MapDebugInput,
): MapNodeDebug {
  const latitude = node.latitude ?? null;
  const longitude = node.longitude ?? null;
  const hasCoordinates = latitude != null && longitude != null;
  const boundary: LocationBoundary | null = node.boundary ?? null;
  const hasBoundary = boundary !== null;

  const base = {
    id: node.id,
    name: node.name,
    slug: node.slug,
    depth,
    placeType: node.placeType,
    placeTypeKey: placeTypeKey(node.placeType),
    latitude,
    longitude,
    hasCoordinates,
    hasBoundary,
    boundaryType: boundary?.type ?? null,
    boundaryAreaKm2: boundary ? boundaryAreaKm2(boundary) : null,
  };

  // No point and no area: silently skipped by `collectMapped`.
  if (!hasCoordinates && !hasBoundary) {
    return {
      ...base,
      rendered: false,
      hiddenReason: "no-geometry",
      renderKind: null,
      color: null,
      colorReason: null,
      icon: null,
    };
  }

  const resolved = resolveLocationDisplay(node, input.displayConfig, input.minAreaKm2);
  if (resolved === "hidden") {
    return {
      ...base,
      rendered: false,
      hiddenReason: "hidden-by-level",
      renderKind: null,
      color: null,
      colorReason: null,
      icon: null,
    };
  }

  const overrideColor = resolveLocationPlaceTypeColor(node, input.colorConfig)
    ?? resolveLocationColor(node, input.displayConfig);
  const fallback = overrideColor === null ? fallbackColor(node, input.displayConfig) : null;
  const color = overrideColor ?? fallback?.color ?? null;
  const icon = resolveLocationIcon(node, input.iconConfig);

  // Same geometry-availability fallbacks `toRenderItems` applies.
  const renderKind: "area" | "pin" = resolved === "area" && hasBoundary
    ? "area"
    : hasCoordinates
      ? "pin"
      : "area";

  return {
    ...base,
    rendered: true,
    hiddenReason: null,
    renderKind,
    color,
    colorReason: fallback?.reason ?? null,
    icon,
  };
}

/**
 * Build a copy/paste-ready diagnostic of everything that decides what a location map draws: the raw
 * props/config, the resolved settings, the viewport, per-node outcomes (rendered vs. why-hidden), and
 * the "Levels" overlay state. Pure — unit-tested; mirrors `LocationMap`'s own rendering logic so the
 * summary counts match the notices shown under the map.
 */
export function buildMapDebugInfo(input: MapDebugInput): MapDebugInfo {
  const nodes = flattenTree(input.tree).map(({
    node, depth,
  }) => describeNode(node, depth, input));

  const rendered = nodes.filter(node => node.rendered);
  const summary = {
    totalNodes: nodes.length,
    withCoordinates: nodes.filter(node => node.hasCoordinates).length,
    withBoundary: nodes.filter(node => node.hasBoundary).length,
    rendered: rendered.length,
    renderedAreas: rendered.filter(node => node.renderKind === "area").length,
    renderedPins: rendered.filter(node => node.renderKind === "pin").length,
    omittedNoGeometry: nodes.filter(node => node.hiddenReason === "no-geometry").length,
    hiddenByLevel: nodes.filter(node => node.hiddenReason === "hidden-by-level").length,
    noPlaceType: rendered.filter(node => node.colorReason === "no-place-type").length,
    noLevel: rendered.filter(node => node.colorReason === "no-level").length,
  };

  return {
    props: {
      className: input.className,
      hideAdminBorders: input.hideAdminBorders,
      displayConfig: input.displayConfig,
      iconConfig: input.iconConfig,
      colorConfig: input.colorConfig,
    },
    settings: {
      minAreaKm2: input.minAreaKm2,
      pinScale: input.pinScale,
    },
    viewport: {
      seededFromPreviousView: input.seedView !== null,
      center: input.seedView?.center ?? [20, 0],
      zoom: input.seedView?.zoom ?? 2,
    },
    summary,
    layers: input.layers ?? null,
    nodes,
  };
}
