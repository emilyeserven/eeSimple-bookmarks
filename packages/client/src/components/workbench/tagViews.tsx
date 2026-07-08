import type { TagNode } from "@eesimple/types";

import { LocalizedNameLabel } from "../LocalizedNameLabel";
import { TagParentEdit } from "../TagGeneralForm";
import { TaxonomyNodeStats } from "./TaxonomyNodeStats";

import { useTagTree } from "@/hooks/useTags";
import { flattenTree, subtreeIds } from "@/lib/tagTree";

export { TagHierarchyView } from "./tagHierarchyView";

/**
 * The `stats` field's view — parent/children/slug/description/bookmark-count stats + the
 * "New Autofill Rule" shortcut. View-only: Parent and Description are separately editable via the
 * `parent`/`description` fields, but this block is where their current values show in view mode.
 */
export function TagStatsView({
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
    <TaxonomyNodeStats
      node={node}
      parent={parent}
      renderParent={parentNode => (
        <LocalizedNameLabel
          names={parentNode.names ?? []}
          base={parentNode.name}
        />
      )}
      autofillClassName="pt-2"
    />
  );
}

/**
 * The `parent` field's edit renderer. Its own component (not an inline arrow calling hooks directly)
 * so `useTagTree` mounts in an isolated fiber, per the field-registry render-seam rule — field
 * renderers must return a JSX element, never call hooks in the render function itself.
 */
export function TagParentEditView({
  entity: node,
}: {
  entity: TagNode;
}) {
  const {
    data,
  } = useTagTree();
  return (
    <TagParentEdit
      node={node}
      allTags={data ?? []}
      forbiddenIds={new Set(subtreeIds(node))}
    />
  );
}
