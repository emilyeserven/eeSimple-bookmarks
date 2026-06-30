import { DivIcon, Icon } from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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

/**
 * Colored pins can't reuse the PNG default marker (a bundler can't recolor an image), so a custom
 * color is drawn as an inline-SVG teardrop `DivIcon` instead. Cached per color — identical pins share
 * one instance — and falls back to {@link DEFAULT_MARKER} when a level has no color.
 */
const coloredMarkerCache = new Map<string, DivIcon>();
export function markerIconFor(color: string | null): Icon | DivIcon {
  if (!color) return DEFAULT_MARKER;
  const cached = coloredMarkerCache.get(color);
  if (cached) return cached;
  const html = "<svg width=\"26\" height=\"38\" viewBox=\"0 0 26 38\" xmlns=\"http://www.w3.org/2000/svg\">"
    + "<path d=\"M13 0C5.82 0 0 5.82 0 13c0 9.75 13 25 13 25s13-15.25 13-25C26 5.82 20.18 0 13 0z\" "
    + `fill="${color}" stroke="#ffffff" stroke-width="1.5"/>`
    + "<circle cx=\"13\" cy=\"13\" r=\"4.5\" fill=\"#ffffff\"/></svg>";
  const icon = new DivIcon({
    html,
    className: "",
    iconSize: [26, 38],
    iconAnchor: [13, 38],
    popupAnchor: [0, -34],
  });
  coloredMarkerCache.set(color, icon);
  return icon;
}
