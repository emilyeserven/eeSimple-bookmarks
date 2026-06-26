import type { ReactNode } from "react";

/**
 * Shared styling for a tab nav item, used by the router-driven `TabbedEntityLayout` (main pane +
 * Settings), the controlled `EntityWorkbenchView` (right panel), and `BookmarkDetailTabbed`.
 * `whitespace-nowrap` keeps labels on one line so the horizontal strip scrolls instead of wrapping.
 */
export const navLinkClass = `
  rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors
  hover:bg-accent hover:text-accent-foreground
`;

/**
 * Shared styling for the horizontal tab-strip `<nav>` container. `TabbedShell` uses it directly;
 * `BookmarkDetailTabbed` builds its own `<nav>` (its placement is media-dependent) and reuses it.
 * `overflow-x-auto` lets the strip scroll horizontally when the tabs exceed the available width.
 */
export const navStripClass = "flex items-center gap-1 overflow-x-auto border-b pb-1";

interface Props {
  /** Optional title/actions block rendered above the tab nav + body. */
  header?: ReactNode;
  /** The rendered nav items (router `<Link>`s on a page, `<button>`s in the panel), or null to omit. */
  nav: ReactNode;
  navAriaLabel: string;
  /** The active tab's body. */
  children: ReactNode;
}

/**
 * The horizontal-tabbed layout shell, shared by the main pane and the right panel so both surfaces
 * look and behave identically: a horizontal, scrollable tab strip sits above the active tab's body.
 * The strip scrolls horizontally when the tabs overflow, so the same rule serves a full-width page,
 * a phone, and the narrow right drawer.
 */
export function TabbedShell({
  header, nav, navAriaLabel, children,
}: Props) {
  // A single-tab (or tab-less) surface drops the nav entirely — no point in a one-item nav.
  if (nav == null) {
    return (
      <section className="space-y-6">
        {header}
        <div className="min-w-0">{children}</div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {header}
      <nav
        aria-label={navAriaLabel}
        className={navStripClass}
      >
        {nav}
      </nav>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
