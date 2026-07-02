import type { EntityListingConfig } from "../entities/types";
import type { ListingScaffoldState } from "../hooks/useListingScaffold";

import { Fragment } from "react";

import { BulkActionBar } from "./bulk/BulkActionBar";
import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { ListingStatusMessages } from "./ListingStatusMessages";

import { COLUMN_CLASS } from "@/lib/bookmarkColumns";

/**
 * The shared search/counts/bulk-bar/table-or-card shell for a flat-entity listing page, configured
 * per entity via `EntityListingConfig`. Pair with `useListingScaffold` (`hooks/useListingScaffold.ts`)
 * for the state. Covers listing shape 1 only (flat + search + bulk + table/card toggle) — tree
 * entities (Tags, Media Types, Locations) and Bookmarks are not scaffold-eligible.
 */
export function ListingScaffold<E extends { id: string }>({
  config,
  state,
}: {
  config: EntityListingConfig<E>;
  state: ListingScaffoldState<E>;
}) {
  const {
    items, isLoading, error, columns, viewMode, rawQuery, hasQuery, filtered, deletableIds, selection, bulkDelete,
  } = state;

  return (
    <div className="space-y-4">
      <ListingStatusMessages
        isLoading={isLoading}
        error={error}
        totalCount={items.length}
        filteredCount={filtered.length}
        rawQuery={rawQuery}
        hasQuery={hasQuery}
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

      {filtered.length > 0 && config.renderTable != null && viewMode === "table"
        ? config.renderTable({
          entities: filtered,
          selection,
        })
        : null}

      {filtered.length > 0 && (config.renderTable == null || viewMode !== "table")
        ? (
          <div
            className={config.layout === "list"
              ? "space-y-2"
              : `
                grid gap-2
                ${COLUMN_CLASS[columns]}
              `}
          >
            {filtered.map(entity => (
              <Fragment key={entity.id}>
                {config.renderListItem({
                  entity,
                  selectable: config.isSelectable ? config.isSelectable(entity) : true,
                  selected: selection.isSelected(entity.id),
                  onSelectToggle: () => selection.toggle(entity.id),
                  inSelectionMode: selection.mode,
                })}
              </Fragment>
            ))}
          </div>
        )
        : null}
    </div>
  );
}
