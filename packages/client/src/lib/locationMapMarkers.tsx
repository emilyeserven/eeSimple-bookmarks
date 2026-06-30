import { DivIcon, Icon } from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { renderToStaticMarkup } from "react-dom/server";

import { CategoryIcon } from "./icons";

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

/** Teardrop fill used when a pin has a custom icon but no custom color (the PNG marker can't host a glyph). */
const DEFAULT_PIN_COLOR = "#3b82f6";

/**
 * Colored / icon-bearing pins can't reuse the PNG default marker (a bundler can't recolor an image,
 * and the PNG can't host a glyph), so they're drawn as an inline-SVG teardrop `DivIcon`. A custom
 * `icon` (a Lucide name) is rendered white in the teardrop center, replacing the plain dot; a plain
 * colored pin keeps the dot. Cached per (color, icon) pair — identical pins share one instance — and
 * falls back to {@link DEFAULT_MARKER} when a place type has neither a color nor an icon.
 */
const coloredMarkerCache = new Map<string, DivIcon>();
export function markerIconFor(color: string | null, icon: string | null = null): Icon | DivIcon {
  if (!color && !icon) return DEFAULT_MARKER;
  const cacheKey = `${color ?? ""}|${icon ?? ""}`;
  const cached = coloredMarkerCache.get(cacheKey);
  if (cached) return cached;
  const fill = color ?? DEFAULT_PIN_COLOR;
  // A 14×14 Lucide glyph centered on the teardrop (center ≈ 13,13 → top-left 6,6), else the plain dot.
  const center = icon
    ? `<g transform="translate(6,6)">${
      renderToStaticMarkup(
        <CategoryIcon
          name={icon}
          color="#ffffff"
          width={14}
          height={14}
        />,
      )}</g>`
    : "<circle cx=\"13\" cy=\"13\" r=\"4.5\" fill=\"#ffffff\"/>";
  const html = "<svg width=\"26\" height=\"38\" viewBox=\"0 0 26 38\" xmlns=\"http://www.w3.org/2000/svg\">"
    + "<path d=\"M13 0C5.82 0 0 5.82 0 13c0 9.75 13 25 13 25s13-15.25 13-25C26 5.82 20.18 0 13 0z\" "
    + `fill="${fill}" stroke="#ffffff" stroke-width="1.5"/>`
    + `${center}</svg>`;
  const newIcon = new DivIcon({
    html,
    className: "",
    iconSize: [26, 38],
    iconAnchor: [13, 38],
    popupAnchor: [0, -34],
  });
  coloredMarkerCache.set(cacheKey, newIcon);
  return newIcon;
}
