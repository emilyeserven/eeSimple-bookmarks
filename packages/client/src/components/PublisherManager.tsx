import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { PublisherListItem } from "./PublisherListItem";
import { PublisherTable } from "./PublisherTable";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useBulkDeletePublishers, usePublishers } from "../hooks/usePublishers";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { COLUMN_CLASS, useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { useListSelection } from "../lib/useListSelection";

/** Browsable, searchable publisher listing. Shared by the Publishers taxonomy page. */
export function PublishersListing() {
  const {
    data: allPublishers, isLoading, error,
  } = usePublishers();
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns("publishers-listing");
  const viewMode = useViewMode("publishers-listing");

  const publishers = allPublishers ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    publishers,
    (p, query) => p.name.toLowerCase().includes(query),
  );

  const deletableIds = filtered.map(p => p.id);
  const selection = useListSelection("publishers-listing", deletableIds);
  useRegisterBulkSelect("publishers-listing");
  const bulkDelete = useBulkDeletePublishers();

  return (
    <div className="space-y-4">
      <ListingStatusMessages
        isLoading={isLoading}
        error={error}
        totalCount={publishers.length}
        filteredCount={filtered.length}
        rawQuery={rawQuery}
        hasQuery={hasQuery}
        loadingLabel="Loading publishers…"
        entityPlural="publishers"
        emptyMessage={(
          <p className="text-muted-foreground">
            No publishers yet. Add one above, then assign them to bookmarks.
          </p>
        )}
      />

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["publisher", "publishers"]}
      />

      {filtered.length > 0 && viewMode === "table"
        ? (
          <PublisherTable
            publishers={filtered}
            selection={selection}
          />
        )
        : null}

      {filtered.length > 0 && viewMode !== "table"
        ? (
          <div
            className={`
              grid gap-2
              ${COLUMN_CLASS[columns]}
            `}
          >
            {filtered.map(publisher => (
              <PublisherListItem
                key={publisher.id}
                publisher={publisher}
                selectable
                selected={selection.isSelected(publisher.id)}
                onSelectToggle={() => selection.toggle(publisher.id)}
                inSelectionMode={selection.mode}
              />
            ))}
          </div>
        )
        : null}
    </div>
  );
}
