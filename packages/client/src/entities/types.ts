import type { EntityWorkbench } from "../components/workbench/types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute, EntityRouteKind } from "../lib/entityRoutes";
import type { ListSelection } from "../lib/useListSelection";
import type { BulkDeleteResult } from "@eesimple/types";
import type { UseMutationResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * The wiring a flat entity needs to render through `ListingScaffold` — the search/counts/
 * bulk-select/table-or-card shell shared by taxonomy listing pages. Tree taxonomies (Tags, Media
 * Types, Locations) use the sibling `EntityTreeListingConfig`/`TreeListingScaffold` instead; only
 * Bookmarks and genuinely bespoke listings (Card Display Rules' drag-sortable priority list) stay
 * outside both.
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
  /**
   * Page-owned predicate applied before the header-search filter — for listings whose route owns
   * richer filter state than `secondaryFilter`'s single scaffold-owned string (e.g. Autofill's
   * 6-facet URL-driven sidebar). The route computes it from its own state and rebuilds the config
   * via a factory + `useMemo` (the PlaceType pattern). Counts still read "N of M" with M = all items.
   */
  externalFilter?: (item: E) => boolean;
  /**
   * An extra facet filter alongside the header search box (e.g. YouTubeChannel's category filter).
   * `ListingScaffold` renders `render`'s UI above the status/bulk-bar row and combines `matches` with
   * the header-search predicate (both must pass). State is scaffold-owned (per `pageKey`), not
   * entity-file-local, so it resets correctly on navigation like the header search does.
   */
  secondaryFilter?: {
    render: (props: { value: string | null;
      onChange: (value: string | null) => void; }) => ReactNode;
    matches: (item: E, value: string | null) => boolean;
  };
  renderListItem: (props: {
    entity: E;
    /** The full unfiltered list, for entities whose card needs cross-item lookups (e.g. a
     * CustomProperty's "calculate" type resolving its operand names from sibling properties). */
    allItems: E[];
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
 * The wiring a tree taxonomy (Tags, Media Types, Locations) needs to render through
 * `TreeListingScaffold` — the search/counts/bulk-bar/expand-toggle/tree-or-table shell. The flat
 * sibling is `EntityListingConfig` above; the shared low-level row primitives
 * (`TaxonomyTreeList`/`TaxonomyTreeRow`) stay entity-agnostic underneath `renderTree`.
 */
export interface EntityTreeListingConfig<N extends { id: string;
  children: N[]; }> {
  /** Key this listing registers under for header search, columns, view mode, and selection. */
  pageKey: string;
  useTree: () => { data: N[] | undefined;
    isLoading: boolean;
    error: Error | null; };
  /**
   * Header-search predicate for a single node (self-match only). The scaffold prunes the tree to
   * nodes that match or have a matching descendant (a matching node keeps its whole subtree) and
   * force-expands all remaining parents while a query is active. Omit for a search-less page.
   */
  matches?: (node: N, query: string) => boolean;
  /** Ids eligible for bulk select/delete, from the filtered tree — Media Types exclude `builtIn`. */
  deletableIds: (tree: N[]) => string[];
  useBulkDelete: () => UseMutationResult<BulkDeleteResult[], Error, string[]>;
  /** Singular/plural noun for the bulk-delete confirm copy, e.g. `["tag", "tags"]`. */
  noun: [string, string];
  loadingLabel: string;
  entityPlural: string;
  emptyMessage: ReactNode;
  /**
   * Client-side re-sort applied to the filtered tree before render. A hook slot (not a pure fn) so
   * entities can read settings stores — Tags: romanized sort; Locations: place-type sort. Must be a
   * stable hook per `pageKey` (same rule as `useBulkDelete`). Defaults to identity.
   */
  useSortedTree?: (tree: N[]) => N[];
  /** Extra controls rendered left of the ExpandAllToggle (e.g. Locations' sort ToggleGroup). */
  renderToolbar?: () => ReactNode;
  renderTree: (props: {
    sortedTree: N[];
    expanded: Set<string>;
    onToggle: (id: string) => void;
    /** Union-expand a subtree (per-row "Expand all") without collapsing other branches. */
    onExpandMany: (ids: string[]) => void;
    columns: number;
    selection: ListSelection;
  }) => ReactNode;
  renderTable: (props: { sortedTree: N[];
    selection: ListSelection; }) => ReactNode;
}

/**
 * Composes the four existing per-entity registries (`ENTITY_ROUTES`, `ENTITY_PALETTE_CONFIGS`,
 * `EntityWorkbench`, and — for scaffold-eligible entities — a listing config) into one module.
 * Each field *references* the entity's existing registry object rather than redefining its shape, so
 * none of `entityRoutes.ts`, `entityPaletteRegistry.ts`, or `components/workbench/*`'s consumers need
 * to change. `entities/publisher.ts` is the pilot migration (issue #860); a registry aggregating all
 * migrated entities lands in a later PR once there's an actual consumer (`matchEntityRoute`, the
 * CMD+K lookup, or the workbench route/panel components).
 *
 * The second generic is the tree-node type for tree taxonomies (`EntityDescriptor<MediaType,
 * MediaTypeNode>`) — the workbench operates on the flat entity while the listing renders nodes.
 */
export interface EntityDescriptor<
  E extends { id: string },
  N extends { id: string;
    children: N[]; } = never,
> {
  kind: EntityRouteKind;
  route: EntityRoute;
  palette: EntityPaletteConfig;
  workbench: EntityWorkbench<E>;
  /** Flat listing. Omitted for tree entities (see `treeListing`), Bookmarks, and bespoke listings. */
  listing?: EntityListingConfig<E>;
  /** Tree listing — mutually exclusive with `listing`. */
  treeListing?: EntityTreeListingConfig<N>;
}
