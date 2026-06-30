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
  onCollapseAll,
}: {
  tree: LocationNode[];
  sortedTree: LocationNode[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onExpandAll: (ids: string[]) => void;
  onCollapseAll: () => void;
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
        columns={columns}
      />
    </>
  );
}
