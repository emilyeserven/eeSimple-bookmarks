import type { TagNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Pencil } from "lucide-react";

import { usePanelControls } from "./panel/usePanelControls";

import { Button } from "@/components/ui/button";

interface TagTreeListProps {
  /** The root tags to render. */
  tree: TagNode[];
  /** Ids of tags whose children are currently expanded. */
  expanded: Set<string>;
  /** Toggle the expanded state of a tag. */
  onToggle: (id: string) => void;
}

/** Read-only, collapsible tag tree. Each row reveals a pencil button that opens the panel. */
export function TagTreeList({
  tree, expanded, onToggle,
}: TagTreeListProps) {
  return (
    <ul className="divide-y rounded-lg border bg-card">
      {tree.map(node => (
        <TagTreeRow
          key={node.id}
          node={node}
          depth={0}
          expanded={expanded}
          onToggle={onToggle}
        />
      ))}
    </ul>
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
  const {
    openTag,
  } = usePanelControls();
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);

  return (
    <>
      <li
        className="group flex items-center gap-2 px-3 py-2"
        style={{
          paddingLeft: `${0.75 + depth * 1.25}rem`,
        }}
      >
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
                : (
                  <ChevronRight
                    className="size-4"
                  />
                )}
            </button>
          )
          : (
            <span
              className="inline-block size-4"
              aria-hidden="true"
            />
          )}

        <Link
          to="/tags/$tagSlug/settings"
          params={{
            tagSlug: node.slug,
          }}
          className="
            flex-1 truncate
            hover:underline
          "
        >
          {node.name}
        </Link>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`Quick view ${node.name}`}
          className="
            opacity-0 transition-opacity
            group-hover:opacity-100
            focus-visible:opacity-100
          "
          onClick={() => openTag(node.id)}
        >
          <Pencil className="size-4" />
        </Button>
      </li>

      {hasChildren && isOpen
        ? node.children.map(child => (
          <TagTreeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
          />
        ))
        : null}
    </>
  );
}
