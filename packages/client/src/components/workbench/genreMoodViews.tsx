import type { GenreMoodNode } from "@eesimple/types";

import { TaxonomyNodeStats } from "./TaxonomyNodeStats";

import { useGenreMoodTree } from "@/hooks/useGenreMoods";
import { flattenTree } from "@/lib/tagTree";

export { GenreMoodHierarchyView } from "./genreMoodHierarchyView";

/** The entry's read-only stat grid (the `stats` layout field): Parent/Children/Slug/Description/
 * Bookmarks/Created + the "New Autofill Rule" button. Kept composite — it's a single read-only grid,
 * not a form, so splitting it would only fragment the display. */
export function GenreMoodStatsView({
  entity: node,
}: {
  entity: GenreMoodNode;
}) {
  const {
    data,
  } = useGenreMoodTree();
  const parent = node.parentId
    ? flattenTree(data ?? []).find(item => item.node.id === node.parentId)?.node
    : null;
  return (
    <TaxonomyNodeStats
      node={node}
      parent={parent}
    />
  );
}
