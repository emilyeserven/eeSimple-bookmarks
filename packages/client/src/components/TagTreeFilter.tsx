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

  const chip = "rounded-full px-3 py-1 text-xs font-medium";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-500">Filter by tag:</span>
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={`
          ${chip}
          ${
    activeId === undefined
      ? "bg-blue-600 text-white"
      : `
        bg-slate-100 text-slate-600
        hover:bg-slate-200
      `
    }
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
            ${
        activeId === node.id
          ? "bg-blue-600 text-white"
          : `
            bg-slate-100 text-slate-600
            hover:bg-slate-200
          `
        }
          `}
        >
          {depth > 0 ? `${"– ".repeat(depth)}` : ""}
          {node.name}
        </button>
      ))}
    </div>
  );
}
