import type { ListSelection } from "../lib/useListSelection";
import type { TagNode } from "@eesimple/types";

import { useMemo } from "react";

import { ExpandAllToggle } from "./ExpandAllToggle";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTagColumns } from "./tables/tagColumns";
import { TagTreeList } from "./TagTreeList";
import { useSortByRomanized } from "../hooks/useAppSettings";
import { useExpandedSet } from "../hooks/useExpandedSet";
import { useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { expandableIds, sortTagTreeByRomanized } from "../lib/tagTree";

import { DataTable } from "@/components/ui/data-table";

/** Renders the tag taxonomy as a sortable table or a collapsible tree, per the active view mode. */
export function TagListBody({
  tree,
  selection,
}: {
  tree: TagNode[];
  selection: ListSelection;
}) {
  const sortByRomanized = useSortByRomanized();
  const sortedTree = useMemo(
    () => sortTagTreeByRomanized(tree, sortByRomanized),
    [tree, sortByRomanized],
  );

  // Empty set means every parent is collapsed by default.
  const {
    expanded, onToggle, expandAll, collapseAll,
  } = useExpandedSet([]);
  const columns = useBookmarkColumns("tags-listing");
  const viewMode = useViewMode("tags-listing");
  const tagColumns = useTagColumns();
  const treeExpandableIds = expandableIds(sortedTree);

  if (tree.length === 0) return null;

  if (viewMode === "table") {
    return (
      <DataTable
        columns={[
          ...(selection.mode ? [listingSelectionColumn<TagNode>(selection, n => n.id)] : []),
          ...tagColumns,
        ]}
        data={sortedTree}
        getSubRows={node => node.children}
      />
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <ExpandAllToggle
          expandableIds={treeExpandableIds}
          expanded={expanded}
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
        />
      </div>
      <TagTreeList
        tree={tree}
        expanded={expanded}
        onToggle={onToggle}
        columns={columns}
      />
    </>
  );
}
