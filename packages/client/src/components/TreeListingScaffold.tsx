import type { EntityTreeListingConfig } from "../entities/types";
import type { TreeListingScaffoldState } from "../hooks/useTreeListingScaffold";

import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { ExpandAllToggle } from "./ExpandAllToggle";
import { ListingSearchBar } from "./ListingSearchBar";
import { ListingStatusMessages } from "./ListingStatusMessages";

/**
 * The shared search/counts/bulk-bar/expand-toggle/tree-or-table shell for a tree-taxonomy listing
 * page (Tags, Media Types, Locations), configured per entity via `EntityTreeListingConfig`. Pair
 * with `useTreeListingScaffold` (`hooks/useTreeListingScaffold.ts`) for the state. The flat sibling
 * is `ListingScaffold`; Bookmarks and bespoke listings (Card Display Rules) stay outside both.
 */
export function TreeListingScaffold<N extends { id: string;
  children: N[]; }>({
  config,
  state,
}: {
  config: EntityTreeListingConfig<N>;
  state: TreeListingScaffoldState<N>;
}) {
  const {
    isLoading, error, columns, viewMode, rawQuery, hasQuery, sortedTree, expanded, onToggle,
    expandAll, expandMany, collapseAll, expandableIds, deletableIds, selection, bulkDelete,
    totalCount, filteredCount,
  } = state;

  const toolbar = config.renderToolbar ? config.renderToolbar() : null;
  // Expansion is forced while a query is active, so the toggle only shows without one.
  const showExpandToggle = viewMode !== "table" && !hasQuery;

  return (
    <div className="space-y-4">
      <ListingSearchBar />

      <ListingStatusMessages
        isLoading={isLoading}
        error={error}
        totalCount={totalCount}
        filteredCount={filteredCount}
        rawQuery={rawQuery}
        hasQuery={hasQuery}
        loadingLabel={config.loadingLabel}
        entityPlural={config.entityPlural}
        emptyMessage={config.emptyMessage}
      />

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={config.noun}
      />

      {sortedTree.length > 0 && viewMode === "table"
        ? (
          <>
            {toolbar
              ? <div className="flex justify-end gap-2">{toolbar}</div>
              : null}
            {config.renderTable({
              sortedTree,
              selection,
            })}
          </>
        )
        : null}

      {sortedTree.length > 0 && viewMode !== "table"
        ? (
          <>
            {toolbar || showExpandToggle
              ? (
                <div className="flex justify-end gap-2">
                  {toolbar}
                  {showExpandToggle
                    ? (
                      <ExpandAllToggle
                        expandableIds={expandableIds}
                        expanded={expanded}
                        onExpandAll={expandAll}
                        onCollapseAll={collapseAll}
                      />
                    )
                    : null}
                </div>
              )
              : null}
            {config.renderTree({
              sortedTree,
              expanded,
              onToggle,
              onExpandMany: expandMany,
              columns,
              selection,
            })}
          </>
        )
        : null}
    </div>
  );
}
