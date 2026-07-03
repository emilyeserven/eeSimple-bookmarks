import type { EntityWorkbench, WorkbenchDelete, WorkbenchMode } from "./types";

import { useNavigate } from "@tanstack/react-router";

import { TabWrapper } from "../TabWrapper";

import { Button } from "@/components/ui/button";

interface Props<E extends { id: string }> {
  workbench: EntityWorkbench<E>;
  /** The tab to render — must match a `workbench.tabs[].key`. */
  tabKey: string;
  mode: WorkbenchMode;
  /** The entity slug from the route params. */
  slug: string;
}

/** The bottom "Danger zone" delete for a General edit tab. Navigates to the listing on success. */
function DangerZone({
  del, entityId, entityName, onDeleted,
}: {
  del: WorkbenchDelete;
  entityId: string;
  entityName: string;
  onDeleted: () => void;
}) {
  return (
    <div className="rounded-lg border border-destructive/50 p-4">
      <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Deleting
        {" "}
        <span className="font-medium">{entityName}</span>
        {" "}
        is permanent and cannot be undone.
      </p>
      <div className="mt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="
            border-destructive/50 text-destructive
            hover:bg-destructive/10 hover:text-destructive
          "
          disabled={del.isPending}
          onClick={() => del.run(entityId, onDeleted)}
        >
          {del.isPending ? "Deleting…" : "Delete"}
        </Button>
      </div>
      {del.error ? <p className="mt-2 text-sm text-destructive">{del.error}</p> : null}
    </div>
  );
}

/**
 * Renders a single workbench tab as a main-pane route body. Each `_view.*` / `edit.*` route is a thin
 * one-liner that delegates here, so the tab's heading, description, and body all come from the shared
 * `EntityWorkbench` descriptor — the same source the right panel renders. The router `<Outlet/>`
 * selects which tab (route) is active; this just renders that tab. The General **edit** tab also gets a
 * bottom "Danger zone" Delete when the descriptor sets `listingPath`.
 */
export function WorkbenchRouteTab<E extends { id: string }>({
  workbench, tabKey, mode, slug,
}: Props<E>) {
  const navigate = useNavigate();
  const {
    entity, isLoading,
  } = workbench.useBySlug(slug);
  const del = workbench.useDelete();
  const tab = workbench.tabs.find(candidate => candidate.key === tabKey);
  const pane = tab ? (mode === "edit" ? tab.edit : tab.view) : undefined;
  const Body = pane?.render;

  const listingPath = workbench.listingPath;
  const showDanger = mode === "edit" && tabKey === "general" && del != null && listingPath != null;

  return (
    <TabWrapper
      entity={entity}
      isLoading={isLoading}
      notFoundMessage={workbench.notFound}
      title={pane?.title ?? ""}
      description={pane?.description ?? ""}
    >
      {resolved => (
        <>
          {Body ? <Body entity={resolved} /> : null}
          {showDanger && del && listingPath && (workbench.canDelete?.(resolved) ?? true)
            ? (
              <DangerZone
                del={del}
                entityId={resolved.id}
                entityName={workbench.name(resolved)}
                onDeleted={() => void navigate({
                  to: listingPath,
                })}
              />
            )
            : null}
        </>
      )}
    </TabWrapper>
  );
}
