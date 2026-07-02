import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { SavedFilterCard } from "./SavedFilterCard";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { useBulkDeleteSavedFilters, useSavedFilters } from "../hooks/useSavedFilters";
import { useListSelection } from "../lib/useListSelection";

/** Browsable, searchable saved-filter listing with bulk delete + "viewable online" controls; used on /saved-filters. */
export function SavedFiltersManager() {
  const {
    data: allFilters, isLoading, error,
  } = useSavedFilters();
  useSetListingPage("saved-filters-listing");
  useRegisterHeaderSearch();

  const filters = allFilters ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    filters,
    (f, query) => f.name.toLowerCase().includes(query),
  );

  const deletableIds = filtered.map(f => f.id);
  const selection = useListSelection("saved-filters-listing", deletableIds);
  useRegisterBulkSelect("saved-filters-listing");
  const bulkDelete = useBulkDeleteSavedFilters();

  return (
    <div className="space-y-4">
      <ListingStatusMessages
        isLoading={isLoading}
        error={error}
        totalCount={filters.length}
        filteredCount={filtered.length}
        rawQuery={rawQuery}
        hasQuery={hasQuery}
        loadingLabel="Loading saved filters…"
        entityPlural="saved filters"
        emptyMessage={(
          <p className="text-muted-foreground">
            No saved filters yet. Set filters on the Bookmarks page and click &ldquo;Save&rdquo; to create one.
          </p>
        )}
      />

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["saved filter", "saved filters"]}
      />

      {filtered.length > 0
        ? (
          <div className="space-y-2">
            {filtered.map(filter => (
              <SavedFilterCard
                key={filter.id}
                filter={filter}
                selectable
                selected={selection.isSelected(filter.id)}
                onSelectToggle={() => selection.toggle(filter.id)}
                inSelectionMode={selection.mode}
              />
            ))}
          </div>
        )
        : null}
    </div>
  );
}
