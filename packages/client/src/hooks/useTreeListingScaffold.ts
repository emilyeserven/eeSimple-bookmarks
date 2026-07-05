import type { EntityTreeListingConfig } from "../entities/types";

import { useExpandedSet } from "./useExpandedSet";
import { useRegisterBulkSelect } from "./useRegisterBulkSelect";
import { useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { countNodes, expandableIds, filterTreeByMatch } from "../lib/tagTree";
import { useListSelection } from "../lib/useListSelection";

import { useUiStore } from "@/stores/uiStore";

/**
 * The wiring behind a `TreeListingScaffold`: header search (tree-pruning semantics), columns/
 * view-mode, expand/collapse state, and bulk-select state for one tree-taxonomy listing (Tags,
 * Media Types, Locations). The flat sibling is `useListingScaffold`.
 *
 * Search prunes the tree to nodes that match or have a matching descendant (a matching node keeps
 * its whole subtree) and force-expands all remaining parents while a query is active, so matches
 * are always visible. Counts are node counts (all depths), not root counts.
 */
export function useTreeListingScaffold<N extends { id: string;
  children: N[]; }>(config: EntityTreeListingConfig<N>) {
  const {
    data, isLoading, error,
  } = config.useTree();
  const columns = useBookmarkColumns(config.pageKey);
  const viewMode = useViewMode(config.pageKey);

  const tree = data ?? [];
  const rawQuery = useUiStore(state => state.headerSearchQuery);
  const query = rawQuery.trim().toLowerCase();
  const hasQuery = query.length > 0;
  const {
    matches,
  } = config;
  const filteredTree = hasQuery && matches
    ? filterTreeByMatch(tree, node => matches(node, query))
    : tree;
  const sortedTree = config.useSortedTree ? config.useSortedTree(filteredTree) : filteredTree;

  const {
    expanded, onToggle, expandAll, expandMany, collapseAll,
  } = useExpandedSet([]);
  const treeExpandableIds = expandableIds(sortedTree);
  // While a query is active every remaining parent is force-expanded so matches are visible; the
  // user's own expand state is preserved untouched underneath and restored when the query clears.
  const effectiveExpanded = hasQuery ? new Set(treeExpandableIds) : expanded;

  const deletableIds = config.deletableIds(sortedTree);
  const selection = useListSelection(config.pageKey, deletableIds);
  useRegisterBulkSelect(config.pageKey);
  const bulkDelete = config.useBulkDelete();

  return {
    tree,
    isLoading,
    error,
    columns,
    viewMode,
    rawQuery,
    hasQuery,
    sortedTree,
    expanded: effectiveExpanded,
    onToggle,
    expandAll,
    expandMany,
    collapseAll,
    expandableIds: treeExpandableIds,
    deletableIds,
    selection,
    bulkDelete,
    totalCount: countNodes(tree),
    filteredCount: countNodes(sortedTree),
  };
}

export type TreeListingScaffoldState<N extends { id: string;
  children: N[]; }> = ReturnType<typeof useTreeListingScaffold<N>>;
