import type { TagNode } from "@eesimple/types";

import { flattenTree } from "../lib/tagTree";

interface TagTreeFilterProps {
  tree: TagNode[];
  activeId?: string;
  onSelect: (id: string | undefined) => void;
}

/**
 * Tag filter for the bookmarks list. Selecting a parent tag filters the list to
 * that tag and its entire subtree (the server expands it).
 */
export function TagTreeFilter({
  tree, activeId, onSelect,
}: TagTreeFilterProps) {
  const flat = flattenTree(tree);
  if (flat.length === 0) return null;

  const chip = "rounded-full px-3 py-1 text-xs font-medium transition-colors";
  const active = "bg-primary text-primary-foreground";
  const inactive = "bg-secondary text-secondary-foreground hover:bg-secondary/80";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Filter by tag:</span>
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={`
          ${chip}
          ${activeId === undefined ? active : inactive}
        `}
      >
        All
      </button>
      {flat.map(({
        node, depth,
      }) => (
        <button
          key={node.id}
          type="button"
          onClick={() => onSelect(node.id)}
          className={`
            ${chip}
            ${activeId === node.id ? active : inactive}
          `}
        >
          {depth > 0 ? `${"– ".repeat(depth)}` : ""}
          {node.name}
        </button>
      ))}
    </div>
  );
}
