import type { LocationNode } from "@eesimple/types";

import { ExpandAllToggle } from "./ExpandAllToggle";
import { LocationTreeList } from "./LocationTreeList";
import { useBookmarkColumns } from "../lib/bookmarkColumns";
import { expandableIds } from "../lib/tagTree";

/** Collapsible-tree view of the Locations listing: an expand-all toggle over the indented tree list. */
export function LocationTreeView({
  tree,
  sortedTree,
  expanded,
  onToggle,
  onExpandAll,
  onExpandMany,
  onCollapseAll,
  filterIds,
  onToggleFilter,
}: {
  tree: LocationNode[];
  sortedTree: LocationNode[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onExpandAll: (ids: string[]) => void;
  /** Union-expand a node's subtree without collapsing other open branches (per-row "Expand all"). */
  onExpandMany?: (ids: string[]) => void;
  onCollapseAll: () => void;
  /** Location ids currently focusing the map (empty = all). */
  filterIds?: string[];
  /** Toggle a location into/out of the map filter from a per-row button. */
  onToggleFilter?: (id: string) => void;
}) {
  const columns = useBookmarkColumns("locations-listing");
  const treeExpandableIds = expandableIds(tree);

  return (
    <>
      <div className="flex justify-end">
        <ExpandAllToggle
          expandableIds={treeExpandableIds}
          expanded={expanded}
          onExpandAll={onExpandAll}
          onCollapseAll={onCollapseAll}
        />
      </div>
      <LocationTreeList
        tree={sortedTree}
        expanded={expanded}
        onToggle={onToggle}
        onExpandMany={onExpandMany}
        columns={columns}
        filterIds={filterIds}
        onToggleFilter={onToggleFilter}
      />
    </>
  );
}
