import type { EntityWorkbench } from "../components/workbench/types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute, EntityRouteKind } from "../lib/entityRoutes";
import type { ListSelection } from "../lib/useListSelection";
import type { BulkDeleteResult } from "@eesimple/types";
import type { UseMutationResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * The wiring a flat (non-tree, non-Bookmarks) entity needs to render through `ListingScaffold` —
 * the search/counts/bulk-select/table-or-card shell shared by taxonomy listing pages. Tree entities
 * (Tags, Media Types, Locations) and Bookmarks render their own bespoke listings and never get one
 * of these.
 */
export interface EntityListingConfig<E extends { id: string }> {
  /** Key this listing registers under for header search, columns, view mode, and selection. */
  pageKey: string;
  useItems: () => { data: E[] | undefined;
    isLoading: boolean;
    error: Error | null; };
  /** Header-search predicate: does `item` match the (already-lowercased) `query`? */
  matches: (item: E, query: string) => boolean;
  /** Ids eligible for bulk-select/delete, derived from the filtered list. Defaults to every id. */
  deletableIds?: (items: E[]) => string[];
  /** Required unless `renderBulkActions` is provided (which owns its own delete UI). */
  useBulkDelete?: () => UseMutationResult<BulkDeleteResult[], Error, string[]>;
  /**
   * Singular/plural noun for the bulk-delete confirm copy, e.g. `["publisher", "publishers"]`.
   * Required unless `renderBulkActions` is provided.
   */
  noun?: [string, string];
  /**
   * Replaces the default `TaxonomyBulkBar` (delete-only) with custom bulk-action content — e.g.
   * Website's "set category/media type", "add/remove tags", and delete dialogs. `ListingScaffold`
   * still renders the shared `BulkActionBar` chrome (count, Select-all, Clear); only the actions
   * inside it are swapped. When provided, `useBulkDelete`/`noun` are unused.
   */
  renderBulkActions?: (props: { selectedIds: string[];
    onDone: () => void; }) => ReactNode;
  loadingLabel: string;
  entityPlural: string;
  emptyMessage: ReactNode;
  /**
   * Card-view arrangement. `"grid"` (default) is the adjustable-column grid most entities use.
   * `"list"` is a fixed single-column stack (e.g. RelationshipType, SavedFilter) — the header's
   * Columns control is still shown (a page-agnostic control) but has no effect, matching those
   * entities' pre-scaffold behavior.
   */
  layout?: "grid" | "list";
  /** Per-item override for whether a row/card can be bulk-selected. Defaults to always selectable. */
  isSelectable?: (item: E) => boolean;
  renderListItem: (props: {
    entity: E;
    selectable?: boolean;
    selected?: boolean;
    onSelectToggle?: () => void;
    inSelectionMode?: boolean;
  }) => ReactNode;
  /**
   * Table view. Omit entirely when the entity has no table view (e.g. SavedFilter) — the header's
   * Cards/Table toggle still appears (page-agnostic) but selecting Table has no effect, matching
   * that entity's pre-scaffold behavior.
   */
  renderTable?: (props: { entities: E[];
    selection: ListSelection; }) => ReactNode;
}

/**
 * Composes the four existing per-entity registries (`ENTITY_ROUTES`, `ENTITY_PALETTE_CONFIGS`,
 * `EntityWorkbench`, and — for scaffold-eligible flat entities — a listing config) into one module.
 * Each field *references* the entity's existing registry object rather than redefining its shape, so
 * none of `entityRoutes.ts`, `entityPaletteRegistry.ts`, or `components/workbench/*`'s consumers need
 * to change. `entities/publisher.ts` is the pilot migration (issue #860); a registry aggregating all
 * migrated entities lands in a later PR once there's an actual consumer (`matchEntityRoute`, the
 * CMD+K lookup, or the workbench route/panel components).
 */
export interface EntityDescriptor<E extends { id: string }> {
  kind: EntityRouteKind;
  route: EntityRoute;
  palette: EntityPaletteConfig;
  workbench: EntityWorkbench<E>;
  /** Omitted for tree entities and Bookmarks — see `EntityListingConfig`'s doc comment. */
  listing?: EntityListingConfig<E>;
}
