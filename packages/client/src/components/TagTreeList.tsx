import type { TagNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { COLUMN_CLASS } from "@/lib/bookmarkColumns";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

interface TagTreeListProps {
  /** The root tags to render. */
  tree: TagNode[];
  /** Ids of tags whose children are currently expanded. */
  expanded: Set<string>;
  /** Toggle the expanded state of a tag. */
  onToggle: (id: string) => void;
  /** Number of grid columns. */
  columns: number;
}

/** Read-only, collapsible tag tree. Each root node is its own card; cards flow in a responsive grid. */
export function TagTreeList({
  tree, expanded, onToggle, columns,
}: TagTreeListProps) {
  return (
    <div className={`grid gap-2 ${COLUMN_CLASS[columns]}`}>
      {tree.map(node => (
        <RowCard
          key={node.id}
          className="overflow-hidden"
        >
          <TagTreeRow
            node={node}
            depth={0}
            expanded={expanded}
            onToggle={onToggle}
          />
        </RowCard>
      ))}
    </div>
  );
}

interface TagTreeRowProps {
  node: TagNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}

function TagTreeRow({
  node, depth, expanded, onToggle,
}: TagTreeRowProps) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);

  const rowInner = (
    <>
      {hasChildren
        ? (
          <button
            type="button"
            aria-label={isOpen ? `Collapse ${node.name}` : `Expand ${node.name}`}
            aria-expanded={isOpen}
            onClick={() => onToggle(node.id)}
            className="
              flex size-4 items-center justify-center text-muted-foreground
              hover:text-foreground
            "
          >
            {isOpen
              ? <ChevronDown className="size-4" />
              : <ChevronRight className="size-4" />}
          </button>
        )
        : (
          <span
            className="inline-block size-4"
            aria-hidden="true"
          />
        )}

      <Link
        to="/tags/$tagSlug"
        params={{ tagSlug: node.slug }}
        title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
        onClick={event => viewClick(event, "tag", node.id)}
        className="flex-1 truncate hover:underline"
      >
        {node.name}
      </Link>

      {node.bookmarkCount != null
        ? <Badge variant="secondary">{node.bookmarkCount}</Badge>
        : null}

      <Button
        asChild
        variant="ghost"
        size="sm"
        className="
          opacity-0 transition-opacity
          group-hover:opacity-100
          focus-visible:opacity-100
        "
      >
        <Link
          to="/tags/$tagSlug/edit/general"
          params={{ tagSlug: node.slug }}
          aria-label={`Edit ${node.name}`}
          title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
          onClick={event => editClick(event, "tag", node.id)}
        >
          <Pencil className="size-4" />
        </Link>
      </Button>
    </>
  );

  if (depth === 0) {
    return (
      <>
        <div className="group flex items-center gap-2 px-3 py-2">
          {rowInner}
        </div>
        {hasChildren && isOpen
          ? (
            <ul className="divide-y border-t">
              {node.children.map(child => (
                <TagTreeRow
                  key={child.id}
                  node={child}
                  depth={1}
                  expanded={expanded}
                  onToggle={onToggle}
                />
              ))}
              {/* Bookmarks tagged with this parent but none of its children. */}
              {(node.ownBookmarkCount ?? 0) > 0
                ? (
                  <li
                    className="
                      flex items-center gap-2 px-3 py-2 text-muted-foreground/70
                      italic
                    "
                    style={{ paddingLeft: `${0.75 + 1.25}rem` }}
                  >
                    <span className="inline-block size-4" aria-hidden="true" />
                    <span className="flex-1 truncate">No Child</span>
                    <Badge variant="outline">{node.ownBookmarkCount}</Badge>
                  </li>
                )
                : null}
            </ul>
          )
          : null}
      </>
    );
  }

  return (
    <>
      <li
        className="group flex items-center gap-2 px-3 py-2"
        style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}
      >
        {rowInner}
      </li>
      {hasChildren && isOpen
        ? (
          <>
            {node.children.map(child => (
              <TagTreeRow
                key={child.id}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
              />
            ))}
            {/* Bookmarks tagged with this parent but none of its children. */}
            {(node.ownBookmarkCount ?? 0) > 0
              ? (
                <li
                  className="
                    flex items-center gap-2 px-3 py-2 text-muted-foreground/70
                    italic
                  "
                  style={{ paddingLeft: `${0.75 + (depth + 1) * 1.25}rem` }}
                >
                  <span className="inline-block size-4" aria-hidden="true" />
                  <span className="flex-1 truncate">No Child</span>
                  <Badge variant="outline">{node.ownBookmarkCount}</Badge>
                </li>
              )
              : null}
          </>
        )
        : null}
    </>
  );
}
