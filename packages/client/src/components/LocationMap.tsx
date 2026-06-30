import type { LocationBoundary, LocationNode } from "@eesimple/types";
import type { Feature, Geometry } from "geojson";
import type { LatLngTuple } from "leaflet";

import { useEffect } from "react";

import { Link } from "@tanstack/react-router";
import { Icon, geoJSON, latLngBounds } from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import { RomanizedLabel } from "./RomanizedLabel";

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
        position,
        boundary,
      }]
      : [];
    return [...here, ...collectMapped(node.children)];
  });
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

/** Imperatively fit the map to every placed node (polygon bounds + point markers) once they load. */
function FitBounds({
  nodes,
}: {
  nodes: MappedNode[];
}) {
  const map = useMap();
  // Re-fit whenever the set of placed nodes changes (e.g. a boundary backfills in).
  const signature = nodes.map(n => `${n.id}:${n.boundary ? "b" : ""}${n.position ? "p" : ""}`).join("|");
  useEffect(() => {
    const bounds = latLngBounds([]);
    for (const node of nodes) {
      if (node.boundary) bounds.extend(geoJSON(toFeature(node.boundary)).getBounds());
      else if (node.position) bounds.extend(node.position);
    }
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 12,
      });
    }
  }, [map, signature, nodes]);
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
}

/**
 * Map for the Locations taxonomy. Each location renders as its **area polygon** when a boundary is
 * known, otherwise as a **pin** at its coordinate; both link to the location's detail page. Nodes
 * with neither a coordinate nor a boundary are omitted (with a count note).
 */
export function LocationMap({
  tree,
  className = "h-[70vh] w-full rounded-lg border",
}: LocationMapProps) {
  const mapped = collectMapped(tree);
  const omitted = countNodes(tree) - mapped.length;

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
        className={className}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds nodes={mapped} />
        {mapped.map(node => (
          node.boundary
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
    </div>
  );
}
