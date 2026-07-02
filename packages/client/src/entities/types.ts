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
  useBulkDelete: () => UseMutationResult<BulkDeleteResult[], Error, string[]>;
  /** Singular/plural noun for the bulk-delete confirm copy, e.g. `["publisher", "publishers"]`. */
  noun: [string, string];
  loadingLabel: string;
  entityPlural: string;
  emptyMessage: ReactNode;
  renderListItem: (props: {
    entity: E;
    selectable?: boolean;
    selected?: boolean;
    onSelectToggle?: () => void;
    inSelectionMode?: boolean;
  }) => ReactNode;
  renderTable: (props: { entities: E[];
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
