import type { ReactNode } from "react";

export type WorkbenchMode = "view" | "edit";

/** One mode (view or edit) of a tab: its heading + the body that renders the entity. */
export interface WorkbenchPane<E> {
  title: string;
  description: string;
  render: (props: { entity: E }) => ReactNode;
}

/** A single tab in an entity's view/edit UI, with separate view and edit bodies. */
export interface WorkbenchTab<E> {
  key: string;
  label: string;
  view: WorkbenchPane<E>;
  edit: WorkbenchPane<E>;
  /** Hide the tab unless this returns true (e.g. a property's "Options" tab only when it has options). */
  showIf?: (entity: E) => boolean;
}

/** A delete control surfaced in the panel header; `run` fires the mutation and dismisses on success. */
export interface WorkbenchDelete {
  isPending: boolean;
  error: string | null;
  run: (id: string, onDeleted: () => void) => void;
}

/**
 * A surface-agnostic description of an entity's tabbed view/edit UI — the **single source of truth**
 * for its tabs + bodies. It is rendered identically by the main pane (`WorkbenchRouteTab`, one tab
 * per route) and the right panel (`EntityWorkbenchView`, all tabs with a controlled active tab), so
 * the two surfaces share the same components and the same responsive `TabbedShell`.
 */
export interface EntityWorkbench<E extends { id: string }> {
  /** Resolve the entity by slug (main pane routes). */
  useBySlug: (slug: string) => { entity: E | undefined;
    isLoading: boolean; };
  /** Resolve the entity by id (right panel). */
  useById: (id: string) => { entity: E | undefined;
    isLoading: boolean;
    error: Error | null; };
  name: (entity: E) => string;
  isBuiltIn?: (entity: E) => boolean;
  /**
   * Hook returning a delete control for the panel header, or `null` when the entity isn't deletable.
   * Always defined (even as `() => null`) so it can be called unconditionally per the Rules of Hooks.
   */
  useDelete: () => WorkbenchDelete | null;
  notFound: string;
  navAriaLabel: string;
  tabs: WorkbenchTab<E>[];
}
