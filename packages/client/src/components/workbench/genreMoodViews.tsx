import type { GenreMoodNode } from "@eesimple/types";

import { GenreMoodGeneralForm } from "../GenreMoodGeneralForm";

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
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Parent</dt>
      <dd>{parent ? parent.name : "(root)"}</dd>
      <dt className="text-muted-foreground">Children</dt>
      <dd>{node.children.length}</dd>
      <dt className="text-muted-foreground">Slug</dt>
      <dd className="font-mono">{node.slug}</dd>
      <dt className="text-muted-foreground">Bookmarks</dt>
      <dd>{node.bookmarkCount ?? 0}</dd>
      {node.children.length > 0 && (node.ownBookmarkCount ?? 0) > 0
        ? (
          <>
            <dt className="text-muted-foreground/70 italic">No Child</dt>
            <dd className="text-muted-foreground/70 italic">{node.ownBookmarkCount}</dd>
          </>
        )
        : null}
      <dt className="text-muted-foreground">Created</dt>
      <dd>{new Date(node.createdAt).toLocaleDateString()}</dd>
    </dl>
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
