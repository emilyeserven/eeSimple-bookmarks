import type { ReactNode } from "react";

import { Outlet } from "@tanstack/react-router";

export const navLinkClass = `
  rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors
  hover:bg-accent hover:text-accent-foreground
`;

interface Props {
  header: ReactNode;
  nav: ReactNode;
}

/** Shared vertical-tabbed layout shell used by all slug-routed entities. */
export function TabbedEntityLayout({
  header, nav,
}: Props) {
  return (
    <section className="space-y-6">
      {header}
      <div
        className="
          flex flex-col gap-6
          sm:flex-row
        "
      >
        {nav}
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </section>
  );
}
