import type { EntityWorkbench } from "./types";
import type { LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import { WorkbenchRouteTab } from "./WorkbenchRouteTab";
import { navLinkClass } from "../TabbedShell";

import { cn } from "@/lib/utils";

interface Props<E extends { id: string }> {
  workbench: EntityWorkbench<E>;
  /** The entity slug from the route params. */
  slug: string;
  /** The info route's `to` template (e.g. `/categories/$categorySlug/info`). */
  infoTo: LinkProps["to"];
  /** Route params shared by every tab link (e.g. `{ categorySlug }`). */
  params: LinkProps["params"];
  /** The active tab key from the `?tab=` search param, or undefined to fall back to the first tab. */
  activeTab: string | undefined;
  /** Optional entity heading (info-only entities render it here; listing entities render it in `_hub`). */
  header?: ReactNode;
}

/**
 * The main-pane **Info** page: a **vertical** tab rail (driven by the `?tab=` search param) beside the
 * active view tab's body. It derives its tabs from the surface-agnostic {@link EntityWorkbench}
 * descriptor and shows the exact same view bodies (via {@link WorkbenchRouteTab}) the old per-segment
 * `_view.*` routes did. On narrow screens the rail collapses to a horizontal scrolling strip. A
 * single-tab entity drops the rail entirely.
 */
export function EntityInfoView<E extends { id: string }>({
  workbench, slug, infoTo, params, activeTab, header,
}: Props<E>) {
  const {
    entity,
  } = workbench.useBySlug(slug);

  // View tabs only; honor `showIf` once the entity is loaded (optimistically include showIf tabs while
  // it loads — they re-filter on the next render).
  const tabs = workbench.tabs.filter(
    tab => tab.view != null && (!tab.showIf || !entity || tab.showIf(entity)),
  );
  const active = tabs.find(tab => tab.key === activeTab)?.key ?? tabs[0]?.key;

  const body = active
    ? (
      <WorkbenchRouteTab
        workbench={workbench}
        tabKey={active}
        mode="view"
        slug={slug}
      />
    )
    : null;

  // A single-tab (or tab-less) surface drops the rail — no point in a one-item nav.
  if (tabs.length <= 1) {
    return (
      <section className="space-y-6">
        {header}
        <div className="min-w-0">{body}</div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {header}
      <div
        className="
          flex flex-col gap-6
          md:flex-row
        "
      >
        <nav
          aria-label={workbench.navAriaLabel}
          className="
            flex flex-row gap-1 overflow-x-auto border-b pb-1
            md:w-48 md:shrink-0 md:flex-col md:border-b-0 md:pb-0
          "
        >
          {tabs.map(tab => (
            <Link
              key={tab.key}
              to={infoTo}
              params={params}
              search={{
                tab: tab.key,
              }}
              className={cn(
                navLinkClass,
                `
                  text-left
                  md:w-full
                `,
                tab.key === active && "bg-accent text-accent-foreground",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0 flex-1">{body}</div>
      </div>
    </section>
  );
}
