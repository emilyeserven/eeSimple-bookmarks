import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { SavedFilter } from "@eesimple/types";

import { SavedFilterCard } from "../components/SavedFilterCard";
import { savedFilterWorkbench } from "../components/workbench/savedFilter";
import { useBulkDeleteSavedFilters, useSavedFilters } from "../hooks/useSavedFilters";
import { SAVED_FILTER_PALETTE } from "../lib/entityPaletteRegistry";
import { SAVED_FILTER_ROUTE } from "../lib/entityRoutes";

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
    entity, ...rest
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
