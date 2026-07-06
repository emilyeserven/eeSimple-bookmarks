import type { GenreMoodNode } from "@eesimple/types";

import { EntityNamesTabView, PrimaryLanguageTabView } from "../entityNames/EntityNamesTab";
import { GenreMoodGeneralForm } from "../GenreMoodGeneralForm";
import { TaxonomyNodeStats } from "./TaxonomyNodeStats";

import { useGenreMoodTree } from "@/hooks/useGenreMoods";
import { flattenTree, subtreeIds } from "@/lib/tagTree";

export { GenreMoodHierarchyView } from "./genreMoodHierarchyView";

export function GenreMoodGeneralView({
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
    <div className="space-y-6">
      <TaxonomyNodeStats
        node={node}
        parent={parent}
      />
      <PrimaryLanguageTabView
        ownerType="genreMood"
        ownerId={node.id}
      />
      <EntityNamesTabView
        ownerType="genreMood"
        ownerId={node.id}
      />
    </div>
  );
}

export function GenreMoodGeneralEdit({
  entity: node,
}: {
  entity: GenreMoodNode;
}) {
  const {
    data,
  } = useGenreMoodTree();
  return (
    <GenreMoodGeneralForm
      node={node}
      allGenreMoods={data ?? []}
      forbiddenIds={new Set(subtreeIds(node))}
    />
  );
}
