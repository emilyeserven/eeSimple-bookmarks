import type { EntityWorkbench, WorkbenchMode, WorkbenchPane } from "./types";

import { PanelLeft } from "lucide-react";

import { TabbedShell, navLinkClass } from "../TabbedShell";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function PaneBody<E>({
  pane, entity,
}: {
  pane: WorkbenchPane<E>;
  entity: E;
}) {
  // Render the body as a component (stable module-level identity) so panes can call their own hooks
  // and get a clean mount/unmount when the active tab changes.
  const Body = pane.render;
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{pane.title}</h2>
        <p className="text-sm text-muted-foreground">{pane.description}</p>
      </div>
      <Body entity={entity} />
    </section>
  );
}

interface Props<E extends { id: string }> {
  workbench: EntityWorkbench<E>;
  id: string;
  mode: WorkbenchMode;
  /** The active tab key, or undefined to fall back to the first tab. */
  activeTab: string | undefined;
  onTabChange: (key: string) => void;
  onModeChange: (mode: WorkbenchMode) => void;
  /** Called after a successful delete (the panel closes). */
  onDeleted: () => void;
  /**
   * When provided, called with the loaded entity to produce the "Open in main pane" click handler.
   * Returning undefined hides the button (e.g. when `getSlug` or the path template is absent).
   */
  buildSendToMainPane?: (entity: E) => (() => void) | undefined;
}

/**
 * Renders an entity's tabbed view/edit UI in the right panel, from its `EntityWorkbench` descriptor.
 * This is the **same** tab bodies + responsive `TabbedShell` the main pane renders, so the panel has
 * full component + feature parity. Tab selection and view/edit mode are controlled via props (URL
 * search params), not a router `<Outlet/>`.
 */
export function EntityWorkbenchView<E extends { id: string }>({
  workbench, id, mode, activeTab, onTabChange, onModeChange, onDeleted, buildSendToMainPane,
}: Props<E>) {
  const {
    entity, isLoading, error,
  } = workbench.useById(id);
  const del = workbench.useDelete();

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-destructive">{error.message}</p>;
  if (!entity) return <p className="text-destructive">{workbench.notFound}</p>;

  // Show only the tabs that have a body for the current mode (a view-only "Hierarchy" tab drops out
  // of edit; an edit-only bookmark tab drops out of view).
  const tabs = workbench.tabs.filter(
    tab => (!tab.showIf || tab.showIf(entity)) && (mode === "edit" ? tab.edit : tab.view),
  );
  const active = tabs.find(tab => tab.key === activeTab) ?? tabs[0];
  const pane = mode === "edit" ? active?.edit : active?.view;
  const canDelete = del != null && (workbench.canDelete?.(entity) ?? true);

  if (!active || !pane) return <p className="text-muted-foreground">Nothing to show.</p>;

  const onSendToMainPane = buildSendToMainPane?.(entity);

  const header = (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-xl font-semibold">{workbench.name(entity)}</h2>
          {workbench.isBuiltIn?.(entity) ? <Badge variant="secondary">Built-in</Badge> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onSendToMainPane && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Open in main pane"
              onClick={onSendToMainPane}
            >
              <PanelLeft className="size-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onModeChange(mode === "edit" ? "view" : "edit")}
          >
            {mode === "edit" ? "Done" : "Edit"}
          </Button>
          {canDelete && del
            ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="
                  text-destructive
                  hover:text-destructive
                "
                disabled={del.isPending}
                onClick={() => del.run(entity.id, onDeleted)}
              >
                {del.isPending ? "Deleting…" : "Delete"}
              </Button>
            )
            : null}
        </div>
      </div>
      {del?.error ? <p className="text-sm text-destructive">{del.error}</p> : null}
    </div>
  );

  const nav = tabs.length > 1
    ? tabs.map(tab => (
      <button
        key={tab.key}
        type="button"
        onClick={() => onTabChange(tab.key)}
        className={cn(
          navLinkClass,
          "text-left",
          tab.key === active.key && "bg-accent text-accent-foreground",
        )}
      >
        {tab.label}
      </button>
    ))
    : null;

  return (
    <TabbedShell
      header={header}
      nav={nav}
      navAriaLabel={workbench.navAriaLabel}
    >
      <PaneBody
        pane={pane}
        entity={entity}
      />
    </TabbedShell>
  );
}
