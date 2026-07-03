import type { LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

export type WorkbenchMode = "view" | "edit";

/** One mode (view or edit) of a tab: its heading + the body that renders the entity. */
export interface WorkbenchPane<E> {
  title: string;
  description: string;
  render: (props: { entity: E }) => ReactNode;
}

/**
 * A single tab in an entity's view/edit UI. At least one of `view` / `edit` must be set; a tab with
 * only one appears solely in that mode (a view-only "Hierarchy" tab, or an edit-only bookmark tab).
 */
export interface WorkbenchTab<E> {
  key: string;
  label: string;
  /** The read-only body; omit for edit-only tabs. */
  view?: WorkbenchPane<E>;
  /** The edit body; omit for view-only tabs (e.g. a tree entity's "Hierarchy" tab). */
  edit?: WorkbenchPane<E>;
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
  /** Whether this entity may be deleted (default: true). Built-in taxonomy rows often return false. */
  canDelete?: (entity: E) => boolean;
  /**
   * Hook returning a delete control for the panel header, or `null` when the entity isn't deletable.
   * Always defined (even as `() => null`) so it can be called unconditionally per the Rules of Hooks.
   */
  useDelete: () => WorkbenchDelete | null;
  notFound: string;
  navAriaLabel: string;
  /**
   * The entity's listing route. When set, the General **edit** tab shows a bottom "Danger zone" Delete
   * (rendered by `WorkbenchRouteTab`) that navigates here on success. Omit for config entities that
   * should not get the main-pane danger zone (autofill, card-display-rules, saved-filters, …).
   */
  listingPath?: LinkProps["to"];
  tabs: WorkbenchTab<E>[];
  /**
   * Returns the entity's URL identifier (slug or id) for its main-pane page.
   * When present, the panel header shows an "Open in main pane" button.
   * Omit for entities without a dedicated slug-routed main-pane page.
   */
  getSlug?: (entity: E) => string | null;
}
