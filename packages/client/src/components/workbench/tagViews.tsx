import type { TagNode } from "@eesimple/types";

import { EntityAutofillSources } from "../EntityAutofillSources";
import { RomanizedLabel } from "../RomanizedLabel";
import { TagGeneralForm } from "../TagGeneralForm";

import { Button } from "@/components/ui/button";
import { useNewAutofillRule } from "@/hooks/useNewAutofillRule";
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
  const newRule = useNewAutofillRule();
  const parent = node.parentId
    ? flattenTree(data ?? []).find(item => item.node.id === node.parentId)?.node
    : null;
  return (
    <>
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Parent</dt>
        <dd>{parent
          ? (
            <RomanizedLabel
              name={parent.name}
              romanized={parent.romanizedName}
            />
          )
          : "(root)"}
        </dd>
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
      <div className="pt-2">
        <p className="mb-2 text-sm font-medium">Autofill</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={newRule.onClick}
        >
          New Autofill Rule
        </Button>
        {newRule.modal}
      </div>
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
