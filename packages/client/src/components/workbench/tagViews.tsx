import type { TagNode } from "@eesimple/types";

import { EntityAutofillSources } from "../EntityAutofillSources";
import { RomanizedLabel } from "../RomanizedLabel";
import { TagGeneralForm } from "../TagGeneralForm";
import { TaxonomyNodeStats } from "./TaxonomyNodeStats";

import { useTagTree } from "@/hooks/useTags";
import { flattenTree, subtreeIds } from "@/lib/tagTree";

export { TagHierarchyView } from "./tagHierarchyView";

export function TagGeneralView({
  entity: node,
}: {
  entity: TagNode;
}) {
  const {
    data,
  } = useTagTree();
  const parent = node.parentId
    ? flattenTree(data ?? []).find(item => item.node.id === node.parentId)?.node
    : null;
  return (
    <>
      <TaxonomyNodeStats
        node={node}
        parent={parent}
        renderParent={parentNode => (
          <RomanizedLabel
            name={parentNode.name}
            romanized={parentNode.romanizedName}
          />
        )}
        autofillClassName="pt-2"
      />
      <EntityAutofillSources
        match={{
          kind: "tag",
          tagId: node.id,
        }}
      />
    </>
  );
}

export function TagGeneralEdit({
  entity: node,
}: {
  entity: TagNode;
}) {
  const {
    data,
  } = useTagTree();
  return (
    <TagGeneralForm
      node={node}
      allTags={data ?? []}
      forbiddenIds={new Set(subtreeIds(node))}
    />
  );
}
