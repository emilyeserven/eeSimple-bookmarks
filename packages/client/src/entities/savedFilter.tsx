import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { SavedFilter, UpdateSavedFilterInput } from "@eesimple/types";

import { SavedFilterCard } from "../components/SavedFilterCard";
import { savedFilterWorkbench } from "../components/workbench/savedFilter";
import { useBulkDeleteSavedFilters, useSavedFilters } from "../hooks/useSavedFilters";
import { savedFiltersApi } from "../lib/api/settings";

/** Hoisted so `entityRoutes.ts`'s `ENTITY_ROUTES` can reference this entry by identity. */
export const SAVED_FILTER_ROUTE: EntityRoute = {
  kind: "saved-filter",
  prefix: "/saved-filters",
  slugIndex: 1,
  listLabel: "Saved Filters",
  singular: "Saved Filter",
  flatCrumbs: true,
};

/** Hoisted so `entityPaletteRegistry.ts`'s `ENTITY_PALETTE_CONFIGS` can reference this entry by identity. */
export const SAVED_FILTER_PALETTE: EntityPaletteConfig = {
  queryKey: ["saved-filters"],
  listFn: () => savedFiltersApi.list(),
  updateFn: (id, patch) => savedFiltersApi.update(id, patch as UpdateSavedFilterInput),
  fields: [
    {
      type: "boolean",
      key: "viewableOnline",
      label: "Sidebar Shortcut",
      getValue: entity => (entity as SavedFilter).viewableOnline,
    },
  ],
};

export const savedFilterListingConfig: EntityListingConfig<SavedFilter> = {
  pageKey: "saved-filters-listing",
  layout: "list",
  useItems: useSavedFilters,
  matches: (filter, query) => filter.name.toLowerCase().includes(query),
  useBulkDelete: useBulkDeleteSavedFilters,
  noun: ["saved filter", "saved filters"],
  loadingLabel: "Loading saved filters…",
  entityPlural: "saved filters",
  emptyMessage: (
    <p className="text-muted-foreground">
      No saved filters yet. Set filters on the Bookmarks page and click &ldquo;Save&rdquo; to create one.
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <SavedFilterCard
      filter={entity}
      {...rest}
    />
  ),
};

/** Sixth `EntityDescriptor` migration (after Publisher #868, Author #872, PropertyGroup #873, Newsletter #874, RelationshipType) — issue #860. */
export const savedFilterDescriptor: EntityDescriptor<SavedFilter> = {
  kind: "saved-filter",
  route: SAVED_FILTER_ROUTE,
  palette: SAVED_FILTER_PALETTE,
  workbench: savedFilterWorkbench,
  listing: savedFilterListingConfig,
};
