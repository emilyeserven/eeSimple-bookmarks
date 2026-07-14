import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { SavedFilter, UpdateSavedFilterInput } from "@eesimple/types";

import { SavedFilterCard } from "../components/SavedFilterCard";
import { savedFilterWorkbench } from "../components/workbench/savedFilter";
import { useBulkDeleteSavedFilters, useSavedFilters } from "../hooks/useSavedFilters";
import i18n from "../i18n";
import { savedFiltersApi } from "../lib/api/settings";
import { starredPaletteField } from "../lib/starredPaletteField";

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const SAVED_FILTER_ROUTE: EntityRoute = {
  kind: "saved-filter",
  prefix: "/saved-filters",
  slugIndex: 1,
  listLabel: i18n.t("Saved Filters"),
  singular: i18n.t("Saved Filter"),
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const SAVED_FILTER_PALETTE: EntityPaletteConfig = {
  queryKey: ["saved-filters"],
  listFn: () => savedFiltersApi.list(),
  updateFn: (id, patch) => savedFiltersApi.update(id, patch as UpdateSavedFilterInput),
  fields: [
    {
      type: "boolean",
      key: "viewableOnline",
      label: i18n.t("Sidebar Shortcut"),
      getValue: entity => (entity as SavedFilter).viewableOnline,
    },
    starredPaletteField,
  ],
};

export const savedFilterListingConfig: EntityListingConfig<SavedFilter> = {
  pageKey: "saved-filters-listing",
  layout: "list",
  useItems: useSavedFilters,
  matches: (filter, query) => filter.name.toLowerCase().includes(query),
  useBulkDelete: useBulkDeleteSavedFilters,
  noun: [i18n.t("saved filter"), i18n.t("saved filters")],
  loadingLabel: i18n.t("Loading saved filters…"),
  entityPlural: i18n.t("saved filters"),
  emptyMessage: (
    <p className="text-muted-foreground">
      {i18n.t("No saved filters yet. Set filters on the Bookmarks page and click “Save” to create one.")}
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

/** Sixth `EntityDescriptor` migration (after Group #868, Person #872, PropertyGroup #873, Newsletter #874, RelationshipType) — issue #860. */
export const savedFilterDescriptor: EntityDescriptor<SavedFilter> = {
  kind: "saved-filter",
  route: SAVED_FILTER_ROUTE,
  palette: SAVED_FILTER_PALETTE,
  workbench: savedFilterWorkbench,
  listing: savedFilterListingConfig,
};
