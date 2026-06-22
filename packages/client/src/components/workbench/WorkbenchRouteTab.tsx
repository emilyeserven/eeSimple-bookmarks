import type { EntityWorkbench, WorkbenchMode } from "./types";

import { TabWrapper } from "../TabWrapper";

interface Props<E extends { id: string }> {
  workbench: EntityWorkbench<E>;
  /** The tab to render — must match a `workbench.tabs[].key`. */
  tabKey: string;
  mode: WorkbenchMode;
  /** The entity slug from the route params. */
  slug: string;
}

/**
 * Renders a single workbench tab as a main-pane route body. Each `_view.*` / `edit.*` route is a thin
 * one-liner that delegates here, so the tab's heading, description, and body all come from the shared
 * `EntityWorkbench` descriptor — the same source the right panel renders. The router `<Outlet/>`
 * selects which tab (route) is active; this just renders that tab.
 */
export function WorkbenchRouteTab<E extends { id: string }>({
  workbench, tabKey, mode, slug,
}: Props<E>) {
  const {
    entity, isLoading,
  } = workbench.useBySlug(slug);
  const tab = workbench.tabs.find(candidate => candidate.key === tabKey);
  const pane = tab ? (mode === "edit" ? tab.edit : tab.view) : undefined;

  return (
    <TabWrapper
      entity={entity}
      isLoading={isLoading}
      notFoundMessage={workbench.notFound}
      title={pane?.title ?? ""}
      description={pane?.description ?? ""}
    >
      {resolved => (pane
        ? pane.render({
          entity: resolved,
        })
        : null)}
    </TabWrapper>
  );
}
