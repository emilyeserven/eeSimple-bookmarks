/**
 * Shared types for the reorderable top-of-homepage "widgets" (Settings → Display → Homepage).
 * These are the blocks shown above the homepage sections: the Markdown text, the Bookmark Quick
 * Add form, and the Search from Homepage bar. Their on/off state lives on the `homepage-content`
 * app-settings group; `widgetOrder` decides the order they render in.
 *
 * Mirrors the `as const` tuple + derived-union pattern used elsewhere in this package, so adding a
 * new widget is a one-line change here rather than a hand-mirrored edit across packages.
 */

/** The reorderable top-of-homepage widgets, in their default display order. */
export const HOMEPAGE_WIDGETS = ["homepageText", "bookmarkQuickAdd", "search"] as const;

/** A single top-of-homepage widget key. */
export type HomepageWidget = (typeof HOMEPAGE_WIDGETS)[number];

/** Default order the homepage widgets render in when none has been saved. */
export const DEFAULT_HOMEPAGE_WIDGET_ORDER: HomepageWidget[] = [...HOMEPAGE_WIDGETS];

/**
 * Resolve a stored widget order into a complete, valid list: keep the recognized, deduped keys in
 * their saved order, then append any known widget missing from the stored value (in default order).
 * Forward-compatible — a widget added to {@link HOMEPAGE_WIDGETS} later still appears for rows saved
 * before it existed — and defensive against junk (non-arrays, unknown keys, duplicates).
 */
export function resolveHomepageWidgetOrder(stored: unknown): HomepageWidget[] {
  const known = new Set<HomepageWidget>(HOMEPAGE_WIDGETS);
  const seen = new Set<HomepageWidget>();
  const ordered: HomepageWidget[] = [];
  if (Array.isArray(stored)) {
    for (const value of stored) {
      if (typeof value === "string" && known.has(value as HomepageWidget) && !seen.has(value as HomepageWidget)) {
        seen.add(value as HomepageWidget);
        ordered.push(value as HomepageWidget);
      }
    }
  }
  for (const widget of HOMEPAGE_WIDGETS) {
    if (!seen.has(widget)) ordered.push(widget);
  }
  return ordered;
}
