import type { EntityListingConfig } from "../entities/types";
import type { ListingScaffoldState } from "../hooks/useListingScaffold";

import { Fragment } from "react";

import { BulkActionBar } from "./bulk/BulkActionBar";
import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { ListingSearchBox } from "./ListingSearchBox";
import { ListingStatusMessages } from "./ListingStatusMessages";

import { COLUMN_CLASS } from "@/lib/bookmarkColumns";
import { partitionListingSections } from "@/lib/listingSections";

/**
 * The shared search/counts/bulk-bar/table-or-card shell for a flat-entity listing page, configured
 * per entity via `EntityListingConfig`. Pair with `useListingScaffold` (`hooks/useListingScaffold.ts`)
 * for the state. Tree taxonomies (Tags, Media Types, Locations) use the sibling
 * `TreeListingScaffold`; Bookmarks and bespoke listings (Card Display Rules) stay outside both.
 */
export function ListingScaffold<E extends { id: string }>({
  config,
  state,
}: {
  config: EntityListingConfig<E>;
  state: ListingScaffoldState<E>;
}) {
  const {
    items, isLoading, error, columns, viewMode, rawQuery, hasQuery, filtered, sorted, facetActive, deletableIds, selection, bulkDelete,
    secondaryFilterValue, setSecondaryFilterValue,
  } = state;

  const groups = partitionListingSections(sorted, config.sections);
  const {
    renderTable,
  } = config;
  const showTable = renderTable != null && viewMode === "table";

  return (
    <div className="space-y-4">
      <ListingSearchBox
        sort={config.renderSearchSort?.()}
        displayRowExtra={config.renderDisplayRowExtra?.()}
      />

      {config.secondaryFilter
        ? config.secondaryFilter.render({
          value: secondaryFilterValue,
          onChange: setSecondaryFilterValue,
        })
        : null}

      <ListingStatusMessages
        isLoading={isLoading}
        error={error}
        totalCount={items.length}
        filteredCount={filtered.length}
        rawQuery={rawQuery}
        hasQuery={hasQuery}
        hasFilter={facetActive}
        loadingLabel={config.loadingLabel}
        entityPlural={config.entityPlural}
        emptyMessage={config.emptyMessage}
      />

      {config.renderBulkActions
        ? (
          <BulkActionBar
            count={selection.count}
            totalSelectable={deletableIds.length}
            allSelected={selection.allSelected}
            onSelectAll={selection.selectAll}
            onClear={selection.clear}
          >
            {config.renderBulkActions({
              selectedIds: selection.selectedIds,
              onDone: selection.clear,
            })}
          </BulkActionBar>
        )
        : bulkDelete && config.noun
          ? (
            <TaxonomyBulkBar
              selection={selection}
              totalSelectable={deletableIds.length}
              bulkDelete={bulkDelete}
              noun={config.noun}
            />
          )
          : null}

      {filtered.length > 0
        ? (
          <div className="space-y-6">
            {groups.map(group => (
              <div
                key={group.key}
                className="space-y-2"
              >
                {group.title != null
                  ? (
                    <h2 className="text-sm font-semibold text-muted-foreground">
                      {group.title}
                    </h2>
                  )
                  : null}

                {showTable
                  ? renderTable({
                    entities: group.items,
                    selection,
                  })
                  : (
                    <div
                      className={config.layout === "list"
                        ? "space-y-2"
                        : `
                          grid gap-2
                          ${COLUMN_CLASS[columns]}
                        `}
                    >
                      {group.items.map(entity => (
                        <Fragment key={entity.id}>
                          {config.renderListItem({
                            entity,
                            allItems: items,
                            selectable: config.isSelectable ? config.isSelectable(entity) : true,
                            selected: selection.isSelected(entity.id),
                            onSelectToggle: shiftKey =>
                              (shiftKey ? selection.selectRange(entity.id) : selection.toggle(entity.id)),
                            inSelectionMode: selection.mode,
                          })}
                        </Fragment>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )
        : null}
    </div>
  );
}
