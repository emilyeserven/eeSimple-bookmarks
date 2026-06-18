import type { TagNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { useEditPanelClick } from "./panel/useEditPanelClick";
import { flattenTree } from "../lib/tagTree";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/**
 * Hover-revealed Edit / See All button group with an always-visible bookmark count to its right.
 * Mirrors `CategoryControls` so tags and categories share the same affordance.
 */
function TagControls({
  node,
}: {
  node: TagNode;
}) {
  const editClick = useEditPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  return (
    <div className="flex items-center gap-2">
      <div
        className="
          flex items-center gap-1 opacity-0 transition-opacity
          group-hover:opacity-100
          focus-within:opacity-100
        "
      >
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link
            to="/tags/$tagSlug/edit"
            params={{
              tagSlug: node.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "tag", node.id)}
          >
            Edit
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link to="/tags">See All</Link>
        </Button>
      </div>
      <Badge variant="secondary">{node.bookmarkCount ?? 0}</Badge>
    </div>
  );
}

interface TagPreviewCardProps {
  node: TagNode;
  /** The full tag tree, used to resolve the parent's display name. */
  allTags: TagNode[];
}

/**
 * Read-only view of a single tag: name, parent, children count, slug and bookmark count, with a
 * hover Edit / See All group. The standalone body for the single tag page; the panel keeps its own
 * richer `TagPanel` but shares the `TagForm` editor.
 */
export function TagPreviewCard({
  node, allTags,
}: TagPreviewCardProps) {
  const parent = node.parentId
    ? flattenTree(allTags).find(item => item.node.id === node.parentId)?.node
    : null;

  return (
    <div className="group space-y-4 rounded-lg border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="min-w-0 truncate text-xl font-semibold">{node.name}</h2>
        <TagControls node={node} />
      </div>
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Parent</dt>
        <dd>{parent ? parent.name : "(root)"}</dd>
        <dt className="text-muted-foreground">Children</dt>
        <dd>{node.children.length}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd>{node.slug}</dd>
        <dt className="text-muted-foreground">Bookmarks</dt>
        <dd>{node.bookmarkCount ?? 0}</dd>
        {/* When the tag has children, call out how many bookmarks sit on it alone. */}
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
    </div>
  );
}
