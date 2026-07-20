import type { EntityWorkbench, WorkbenchDelete, WorkbenchMode } from "./types";
import type { EntityLayout } from "@eesimple/types";
import type { ReactNode } from "react";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { LayoutDrivenTabBody } from "./LayoutDrivenTabBody";
import { TabWrapper } from "../TabWrapper";

import { Button } from "@/components/ui/button";

interface Props<E extends { id: string }> {
  workbench: EntityWorkbench<E>;
  /** The tab to render — a `workbench.tabs[].key` (legacy) or a `layout.tabs[].key` (layout-driven). */
  tabKey: string;
  mode: WorkbenchMode;
  /** The entity slug from the route params. */
  slug: string;
  /**
   * The resolved layout when the entity is layout-driven (`workbench.fields` set). Present ⇒ the body
   * is a `LayoutDrivenTabBody` section stack instead of the tab's opaque pane `render`; the tab-level
   * heading is dropped. Omit for registry-less entities (unchanged legacy pane path).
   */
  layout?: EntityLayout;
}

/**
 * The bottom "Danger zone" delete for a General edit tab. Navigates to the listing on success. When
 * the descriptor supplies a custom `affordance` (e.g. Tags' reassign-on-delete dialog), it renders in
 * place of the plain button; otherwise the button fires `del.run`.
 */
function DangerZone({
  del, entityId, entityName, onDeleted, affordance,
}: {
  del: WorkbenchDelete;
  entityId: string;
  entityName: string;
  onDeleted: () => void;
  affordance?: ReactNode;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="rounded-lg border border-destructive/50 p-4">
      <h3 className="text-sm font-semibold text-destructive">{t("Danger zone")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("Deleting {{entityName}} is permanent and cannot be undone.", {
          entityName,
        })}
      </p>
      <div className="mt-3">
        {affordance ?? (
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
            {del.isPending ? t("Deleting…") : t("Delete")}
          </Button>
        )}
      </div>
      {!affordance && del.error ? <p className="mt-2 text-sm text-destructive">{del.error}</p> : null}
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
  workbench, tabKey, mode, slug, layout,
}: Props<E>) {
  const navigate = useNavigate();
  const {
    entity, isLoading,
  } = workbench.useBySlug(slug);
  const del = workbench.useDelete();

  // Layout-driven when a resolved layout is handed down alongside a field registry; otherwise the
  // legacy path resolves the tab's opaque pane by mode.
  const layoutDriven = layout != null && workbench.fields != null;
  const tab = layoutDriven ? undefined : workbench.tabs.find(candidate => candidate.key === tabKey);
  const pane = tab ? (mode === "edit" ? tab.edit : tab.view) : undefined;
  const Body = pane?.render;

  const listingPath = workbench.listingPath;
  const showDanger = mode === "edit" && tabKey === "general" && del != null && listingPath != null;

  return (
    <TabWrapper
      entity={entity}
      isLoading={isLoading}
      notFoundMessage={workbench.notFound}
      title={layoutDriven ? "" : (pane?.title ?? "")}
      description={layoutDriven ? "" : (pane?.description ?? "")}
    >
      {resolved => (
        <>
          {layoutDriven && layout
            ? (
              <LayoutDrivenTabBody
                workbench={workbench}
                layout={layout}
                tabKey={tabKey}
                mode={mode}
                entity={resolved}
              />
            )
            : Body
              ? <Body entity={resolved} />
              : null}
          {showDanger && del && listingPath && (workbench.canDelete?.(resolved) ?? true)
            ? (
              <DangerZone
                del={del}
                entityId={resolved.id}
                entityName={workbench.name(resolved)}
                onDeleted={() => void navigate({
                  to: listingPath,
                })}
                affordance={workbench.renderDeleteAffordance?.({
                  entity: resolved,
                  onDeleted: () => void navigate({
                    to: listingPath,
                  }),
                })}
              />
            )
            : null}
        </>
      )}
    </TabWrapper>
  );
}
