import type { EntityLayout, LayoutStorageKind } from "@eesimple/types";
import type { LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type WorkbenchMode = "view" | "edit";

/** One mode (view or edit) of a tab: its heading + the body that renders the entity. */
export interface WorkbenchPane<E> {
  title: string;
  description: string;
  render: (props: { entity: E }) => ReactNode;
}

/**
 * A single placeable, mode-aware field unit — the layout-editor (#1106) replacement for the opaque
 * per-tab {@link WorkbenchPane.render}. A stored {@link EntityLayout} arranges these by `key` into
 * tabs/sections; the active mode picks the `view` / `edit` renderer, so view/edit parity is by
 * construction (one layout tree, never per-mode storage). An **edit-only** field (`view` omitted)
 * renders nothing in view; a **view-only** field (`edit` omitted) renders nothing in edit — this is
 * what reproduces today's view-only ("Hierarchy") / edit-only ("Display") tabs without special-casing.
 *
 * A composite editor (Conditions builder, gallery grid, location map, a rules list) registers as ONE
 * field; its internals are not decomposed (design decision #6). Auto-save (`useFieldAutoSave`) stays
 * inside the `edit` renderer — the layout system never touches save semantics.
 */
export interface WorkbenchField<E> {
  /** Stable machine slug, unique within the entity kind (identity for merge/diff; never shown). */
  key: string;
  /** Default English label (user-overridable per-layout). Editor/rail metadata, not the body. */
  label: string;
  /** Real component (the serialized layout stores only the icon's string name). Editor metadata. */
  icon?: LucideIcon;
  /** Read-only renderer; omit ⇒ the field never appears in view mode. */
  view?: (props: { entity: E }) => ReactNode;
  /** Edit renderer; owns its own `useFieldAutoSave`. Omit ⇒ the field never appears in edit mode. */
  edit?: (props: { entity: E }) => ReactNode;
  /** Hide the field unless this returns true (e.g. a property's Options only when it has options). */
  showIf?: (entity: E) => boolean;
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
  /**
   * Edit-strip only: consecutive edit tabs sharing this label collapse into one trailing "More"-style
   * dropdown in `EntityEditView` (e.g. a category's "Rules" group). Ignored by the Info rail.
   */
  group?: string;
}

/**
 * A set of **dynamic** (runtime-sourced) placeable fields — the layout engine's escape hatch from the
 * compile-time-static {@link EntityWorkbench.fields} registry (#1163+). A descriptor's optional
 * {@link EntityWorkbench.useDynamicFields} hook returns these; the engine merges them into `fields`
 * (so they render + list as placeable) and appends their keys to `defaultHome` in the augmented default
 * layout (so an unplaced/new one is never invisible — the same invariant `resolveLayout` guarantees for
 * static fields). Reference source: each **enabled custom property** becomes one field keyed by its id
 * (see `bookmark.tsx` `useBookmarkDynamicFields`), mirroring the Card Display Rules card-field system.
 */
export interface DynamicFieldSet<E> {
  /** Dynamic field registry, keyed by the runtime key (e.g. a custom property's id). */
  fields: Record<string, WorkbenchField<E>>;
  /** The default-layout tab+section an unplaced dynamic key is appended to. */
  defaultHome: { tabKey: string;
    sectionKey: string; };
}

/** A delete control surfaced in the panel header; `run` fires the mutation and dismisses on success. */
export interface WorkbenchDelete {
  isPending: boolean;
  error: string | null;
  run: (id: string, onDeleted: () => void) => void;
}

/**
 * A surface-agnostic description of an entity's tabbed view/edit UI — the **single source of truth**
 * for its tabs + bodies. It is rendered by the main pane via `WorkbenchRouteTab` (one tab per route),
 * so every surface shares the same components and the same responsive `TabbedShell`.
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
   * **Opt-in to the layout editor (#1106).** When set together with {@link fields} and
   * {@link defaultLayout}, this entity is **layout-driven**: `EntityInfoView`/`EntityEditView` build
   * their tab rail + per-tab section stacks from the resolved {@link EntityLayout} (registry `fields`
   * dispatched by mode) instead of `tabs`/pane `render`. Omit all three and the entity keeps its opaque
   * `tabs`/panes untouched — migration is incremental (per-entity registries land in #1161/#1163+).
   */
  layoutKind?: LayoutStorageKind;
  /**
   * The field registry: field key → mode-aware {@link WorkbenchField}. Authored per entity as an
   * exhaustive `Record<FieldKey, WorkbenchField<E>>` (the `bookmarkAddFormFields.tsx` FIELD_RENDERERS
   * idiom) so a declared key without a renderer fails `tsc`. Consumed only when {@link layoutKind} +
   * {@link defaultLayout} are also set.
   */
  fields?: Record<string, WorkbenchField<E>>;
  /**
   * The code-defined default layout, referencing {@link fields} keys. An absent/empty stored layout
   * resolves to this (via the shared `resolveLayout`), so a deploy with no saved layout renders as
   * today. Defaults derive from code, never the DB.
   */
  defaultLayout?: EntityLayout;
  /**
   * **Shared-`useAppForm` extraction seam (#1188).** When a General composite is broken into granular
   * edit fields that all read **one** controller from a React context (the form-context-provider
   * pattern — see the `surface-entity-field` skill), `EntityEditView` wraps the edit body in
   * {@link editFormProvider} whenever the active tab hosts any of these field keys, so the single
   * controller mounts exactly where the fields live (and follows them if an operator relocates them via
   * Page Layouts). This is the slug-routed analogue of `BookmarkEditView`'s `SHARED_FORM_FIELD_KEYS`;
   * omit both when no field needs a shared controller. Reference: `websiteWorkbench`.
   */
  sharedFormFieldKeys?: Set<string>;
  /**
   * The provider that instantiates the shared edit-form controller once (see {@link sharedFormFieldKeys}).
   * `EntityEditView` renders `<Provider entity={entity}>{editBody}</Provider>` around the active edit
   * tab. Omit for entities whose granular fields are all independently-backed.
   */
  editFormProvider?: (props: { entity: E;
    children: ReactNode; }) => ReactNode;
  /**
   * **Dynamic (user-defined) placeable fields (#1163+).** A hook returning a {@link DynamicFieldSet}
   * of fields sourced from runtime data (e.g. one field per enabled custom property, keyed by id).
   * `useLayoutDrivenWorkbench` merges these into {@link fields} and augments {@link defaultLayout} so
   * they render, list in the Page Layouts editor, and get a default home — the general-capability seam
   * that lets the layout system place user-defined data, not just the compile-time registry. Called as
   * a hook (its name starts with `use`), so it may read react-query. Omit for entities with no dynamic
   * source (the common case — the merge is then a no-op).
   */
  useDynamicFields?: () => DynamicFieldSet<E>;
  /**
   * Returns the entity's URL identifier (slug or id) for its main-pane page.
   * When present, the panel header shows an "Open in main pane" button.
   * Omit for entities without a dedicated slug-routed main-pane page.
   */
  getSlug?: (entity: E) => string | null;
}
