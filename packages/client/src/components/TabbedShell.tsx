import type { ReactNode } from "react";

/**
 * Shared styling for a tab nav item, used by both the router-driven `TabbedEntityLayout` (main pane),
 * the controlled `EntityWorkbenchView` (right panel), and `BookmarkDetailTabbed`. `whitespace-nowrap`
 * keeps labels on one line so the horizontal strip (narrow containers) scrolls instead of wrapping.
 */
export const navLinkClass = `
  rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors
  hover:bg-accent hover:text-accent-foreground
`;

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
 * The responsive vertical-tabbed layout shell, shared by the main pane and the right panel so both
 * surfaces look and behave identically. It is **container-query driven** (`@container/tabs`), not
 * viewport driven, so it adapts to its own width: a wide container (a full-width page) gets the
 * left vertical nav, while a narrow one (a phone, or the right drawer) collapses to a single
 * horizontal, scrollable tab strip. One rule serves both, so making the panel parity-correct also
 * makes the main pane mobile-friendly.
 */
export function TabbedShell({
  header, nav, navAriaLabel, children,
}: Props) {
  // A single-tab (or tab-less) surface drops the nav column entirely — no point in a one-item nav.
  if (nav == null) {
    return (
      <section className="@container/tabs space-y-6">
        {header}
        <div className="min-w-0">{children}</div>
      </section>
    );
  }

  return (
    <section className="@container/tabs space-y-6">
      {header}
      <div
        className="
          flex flex-col gap-6
          @2xl/tabs:flex-row @2xl/tabs:items-start
        "
      >
        <nav
          aria-label={navAriaLabel}
          className="
            flex shrink-0 gap-1 overflow-x-auto pb-1
            @2xl/tabs:w-48 @2xl/tabs:flex-col @2xl/tabs:overflow-visible
            @2xl/tabs:pb-0
          "
        >
          {nav}
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </section>
  );
}
