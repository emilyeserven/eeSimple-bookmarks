import type { LocationNode } from "@eesimple/types";
import type { LatLngBoundsExpression, LatLngTuple } from "leaflet";

import { Link } from "@tanstack/react-router";
import { Icon } from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

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

/** A location reduced to the fields the map needs, guaranteed to have a coordinate. */
interface LocatedNode {
  id: string;
  name: string;
  romanizedName: string | null | undefined;
  slug: string;
  position: LatLngTuple;
}

/** Depth-first flatten of the location tree to every node carrying a usable coordinate. */
function collectLocated(nodes: LocationNode[]): LocatedNode[] {
  return nodes.flatMap((node) => {
    const here: LocatedNode[] = node.latitude != null && node.longitude != null
      ? [{
        id: node.id,
        name: node.name,
        romanizedName: node.romanizedName,
        slug: node.slug,
        position: [node.latitude, node.longitude],
      }]
      : [];
    return [...here, ...collectLocated(node.children)];
  });
}

/** Count every node in the tree, regardless of whether it has a coordinate. */
function countNodes(nodes: LocationNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);
}

interface LocationMapProps {
  /** The full location tree; nodes without coordinates are silently skipped. */
  tree: LocationNode[];
}

/**
 * Map view for the Locations taxonomy: one pin per location that has stored coordinates. Clicking a
 * pin opens a popup with the (romanized) name linking to that location's detail page. Locations
 * without coordinates can't be placed and are omitted (with a count note).
 */
export function LocationMap({
  tree,
}: LocationMapProps) {
  const located = collectLocated(tree);
  const omitted = countNodes(tree) - located.length;

  if (located.length === 0) {
    return (
      <p className="text-muted-foreground">
        No locations have coordinates yet. Add one via a location’s geocoding lookup to place it on
        the map.
      </p>
    );
  }

  const bounds: LatLngBoundsExpression = located.map(node => node.position);

  return (
    <div className="space-y-2">
      <MapContainer
        bounds={bounds}
        boundsOptions={{
          padding: [50, 50],
          maxZoom: 12,
        }}
        scrollWheelZoom
        className="h-[70vh] w-full rounded-lg border"
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map(node => (
          <Marker
            key={node.id}
            position={node.position}
            icon={DEFAULT_MARKER}
          >
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
          </Marker>
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
