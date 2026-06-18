import type { HomepageContentWidth } from "@eesimple/types";

/**
 * Tailwind width classes for a homepage content block. "half" is full-width on mobile and half the
 * column on desktop (`md:` and up); "full" always spans the column.
 */
export function contentWidthClass(width: HomepageContentWidth): string {
  return width === "half" ? "col-span-2 md:col-span-1" : "col-span-2";
}
