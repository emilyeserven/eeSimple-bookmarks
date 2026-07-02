import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { PropertyGroupListBody } from "./PropertyGroupListBody";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useBulkDeletePropertyGroups, usePropertyGroups } from "../hooks/usePropertyGroups";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { useListSelection } from "../lib/useListSelection";

/** Browsable, searchable property-group listing. */
export function PropertyGroupsListing() {
  const {
    data: allGroups, isLoading, error,
  } = usePropertyGroups();
  // The route (taxonomies.property-groups.index) owns the useSetListingPage registration — a second
  // bare call here would clobber its create-button affordances.
  useRegisterHeaderSearch();

  const groups = allGroups ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    groups,
    (g, query) => g.name.toLowerCase().includes(query) || g.slug.toLowerCase().includes(query),
  );

  const deletableIds = filtered.map(g => g.id);
  const selection = useListSelection("property-groups-listing", deletableIds);
  useRegisterBulkSelect("property-groups-listing");
  const bulkDelete = useBulkDeletePropertyGroups();

  return (
    <div className="space-y-4">
      <ListingStatusMessages
        isLoading={isLoading}
        error={error}
        totalCount={groups.length}
        filteredCount={filtered.length}
        rawQuery={rawQuery}
        hasQuery={hasQuery}
        loadingLabel="Loading property groups…"
        entityPlural="property groups"
        emptyMessage={(
          <p className="text-muted-foreground">
            No property groups yet.
          </p>
        )}
      />

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["property group", "property groups"]}
      />

      <PropertyGroupListBody
        groups={filtered}
        selection={selection}
      />
    </div>
  );
}
