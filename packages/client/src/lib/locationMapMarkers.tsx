import { DivIcon } from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";

import { CategoryIcon } from "./icons";

/**
 * Teardrop fill used when a pin has neither a custom color nor a level-group color (e.g. a level
 * group whose palette color was deliberately left to "areas only"). Gray rather than the app's accent
 * blue, so an unstyled pin reads as "no color set" instead of looking like an intentional choice.
 */
const DEFAULT_PIN_COLOR = "#9ca3af";

/**
 * Every pin is drawn as an inline-SVG teardrop `DivIcon` so it can be recolored and host a glyph (a
 * bundler can't recolor a PNG marker image, and a PNG can't host a Lucide icon). A custom `icon` (a
 * Lucide name) is rendered white in the teardrop center, replacing the plain dot; a plain colored pin
 * keeps the dot. Cached per (color, icon) pair — identical pins share one instance — and falls back to
 * {@link DEFAULT_PIN_COLOR} (gray) when neither a color nor an icon is configured.
 */
const coloredMarkerCache = new Map<string, DivIcon>();
/**
 * @param scale User-configurable size multiplier (Settings → Locations → Pin Style "Pin size"),
 * applied on top of the base 40%-larger-than-artwork display size. Defaults to `1` (100%).
 */
export function markerIconFor(color: string | null, icon: string | null = null, scale = 1): DivIcon {
  const cacheKey = `${color ?? ""}|${icon ?? ""}|${scale}`;
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
  // Rendered 40% larger than the underlying 26×38 artwork (viewBox stays 26×38; only the display
  // width/height grow) so the pin is a comfortable touch/click target, not just a visual mark; the
  // user's scale setting multiplies that base display size further.
  const width = Math.round(36 * scale);
  const height = Math.round(53 * scale);
  const html = `<svg width="${width}" height="${height}" viewBox="0 0 26 38" xmlns="http://www.w3.org/2000/svg">`
    + "<path d=\"M13 0C5.82 0 0 5.82 0 13c0 9.75 13 25 13 25s13-15.25 13-25C26 5.82 20.18 0 13 0z\" "
    + `fill="${fill}" stroke="#ffffff" stroke-width="1.5"/>`
    + `${center}</svg>`;
  const newIcon = new DivIcon({
    html,
    className: "",
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height + 5],
  });
  coloredMarkerCache.set(cacheKey, newIcon);
  return newIcon;
}
