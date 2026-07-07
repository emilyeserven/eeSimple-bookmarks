import type { EntityWorkbench, WorkbenchTab } from "./types";
import type { LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { WorkbenchRouteTab } from "./WorkbenchRouteTab";
import { TabbedShell, navLinkClass } from "../TabbedShell";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Props<E extends { id: string }> {
  workbench: EntityWorkbench<E>;
  /** The entity slug from the route params. */
  slug: string;
  /** The edit route's `to` template (e.g. `/categories/$categorySlug/edit`). */
  editTo: LinkProps["to"];
  /** Route params shared by every tab link (e.g. `{ categorySlug }`). */
  params: LinkProps["params"];
  /** The active tab key from the `?tab=` search param, or undefined to fall back to the first tab. */
  activeTab: string | undefined;
  /** The entity heading (back-link + `<h1>`); edit surfaces render their own since they sit outside `_hub`. */
  header?: ReactNode;
}

/** A `nav` entry: a flat tab, or a run of consecutive same-`group` tabs collapsed into a dropdown. */
type EditNavEntry<E>
  = | { kind: "tab";
    tab: WorkbenchTab<E>; }
    | { kind: "group";
      label: string;
      tabs: WorkbenchTab<E>[]; };

/**
 * Collapse consecutive edit tabs that share a `group` label into a single dropdown entry. A tab
 * without `group`, or one whose group differs from the previous entry's, starts a fresh flat entry.
 */
function groupEditTabs<E>(tabs: WorkbenchTab<E>[]): EditNavEntry<E>[] {
  const entries: EditNavEntry<E>[] = [];
  for (const tab of tabs) {
    const group = tab.group;
    const last = entries[entries.length - 1];
    if (group != null && last?.kind === "group" && last.label === group) {
      last.tabs.push(tab);
    }
    else if (group != null) {
      entries.push({
        kind: "group",
        label: group,
        tabs: [tab],
      });
    }
    else {
      entries.push({
        kind: "tab",
        tab,
      });
    }
  }
  return entries;
}

function EditNavLink<E extends { id: string }>({
  tab, editTo, params, active,
}: {
  tab: WorkbenchTab<E>;
  editTo: LinkProps["to"];
  params: LinkProps["params"];
  active: boolean;
}) {
  return (
    <Link
      to={editTo}
      params={params}
      search={{
        tab: tab.key,
      }}
      className={cn(navLinkClass, active && "bg-accent text-accent-foreground")}
    >
      {tab.label}
    </Link>
  );
}

/**
 * A run of grouped edit tabs collapsed into a trailing "More" dropdown, mirroring `MoreMenu` in
 * `TabbedEntityLayout`. The trigger shows the active styling when the current `?tab=` is one of the
 * group's tabs. (The trigger text stays "More" to match the old path-routed strip.)
 */
function EditNavMore<E extends { id: string }>({
  tabs, editTo, params, activeKey,
}: {
  tabs: WorkbenchTab<E>[];
  editTo: LinkProps["to"];
  params: LinkProps["params"];
  activeKey: string | undefined;
}) {
  const {
    t,
  } = useTranslation();
  const isActive = tabs.some(tab => tab.key === activeKey);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            navLinkClass,
            "flex items-center gap-1",
            isActive && "bg-accent text-accent-foreground",
          )}
        >
          {t("More")}
          <ChevronDown className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {tabs.map(tab => (
          <DropdownMenuItem
            key={tab.key}
            asChild
          >
            <Link
              to={editTo}
              params={params}
              search={{
                tab: tab.key,
              }}
            >
              {tab.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The main-pane **Edit** page: the edit-mode mirror of {@link import("./EntityInfoView").EntityInfoView}.
 * A horizontal tab strip (the shared `TabbedShell` frame) derives from the surface-agnostic
 * {@link EntityWorkbench} descriptor's **edit** panes (honoring `showIf`), and the active tab is the
 * `?tab=` search param — so there is a single `…/$slug/edit` route instead of one route file per tab.
 * Consecutive tabs sharing a `group` collapse into a trailing "More" dropdown. Each tab body is the
 * exact same `WorkbenchRouteTab` (`mode="edit"`) the old per-segment `edit.*` routes rendered, so
 * per-field auto-save and the General-tab Danger zone are unchanged. A single-tab entity drops the strip.
 */
export function EntityEditView<E extends { id: string }>({
  workbench, slug, editTo, params, activeTab, header,
}: Props<E>) {
  const {
    entity,
  } = workbench.useBySlug(slug);

  // Edit tabs only; honor `showIf` once the entity is loaded (optimistically include showIf tabs while
  // it loads — they re-filter on the next render).
  const tabs = workbench.tabs.filter(
    tab => tab.edit != null && (!tab.showIf || !entity || tab.showIf(entity)),
  );
  const active = tabs.find(tab => tab.key === activeTab)?.key ?? tabs[0]?.key;

  const body = active
    ? (
      <WorkbenchRouteTab
        workbench={workbench}
        tabKey={active}
        mode="edit"
        slug={slug}
      />
    )
    : null;

  // A single-tab (or tab-less) surface drops the strip — `TabbedShell` omits the `<nav>` on null.
  const nav = tabs.length <= 1
    ? null
    : groupEditTabs(tabs).map(entry => (entry.kind === "group"
      ? (
        <EditNavMore
          key={`group:${entry.label}`}
          tabs={entry.tabs}
          editTo={editTo}
          params={params}
          activeKey={active}
        />
      )
      : (
        <EditNavLink
          key={entry.tab.key}
          tab={entry.tab}
          editTo={editTo}
          params={params}
          active={entry.tab.key === active}
        />
      )));

  return (
    <TabbedShell
      header={header}
      nav={nav}
      navAriaLabel={workbench.navAriaLabel}
    >
      {body}
    </TabbedShell>
  );
}
