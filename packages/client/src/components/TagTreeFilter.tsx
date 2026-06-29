import type { TagNode } from "@eesimple/types";

import { RomanizedLabel } from "./RomanizedLabel";
import { useSortByRomanized } from "../hooks/useAppSettings";
import { flattenTree, sortTagTreeByRomanized } from "../lib/tagTree";

interface TagTreeFilterProps {
  tree: TagNode[];
  activeId?: string;
  onSelect: (id: string | undefined) => void;
}

/**
 * Tiered-tag filter for a search page's sidebar. Renders the tag tree as a vertical,
 * indented list; selecting a parent tag filters the list to that tag and its entire
 * subtree (the server expands it).
 */
export function TagTreeFilter({
  tree, activeId, onSelect,
}: TagTreeFilterProps) {
  const sortByRomanized = useSortByRomanized();
  const flat = flattenTree(sortTagTreeByRomanized(tree, sortByRomanized));
  if (flat.length === 0) return null;

  const item = "w-full rounded-md px-2 py-1 text-left text-sm transition-colors";
  const active = "bg-primary text-primary-foreground";
  const inactive = "text-foreground hover:bg-accent hover:text-accent-foreground";

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={`
          ${item}
          ${activeId === undefined ? active : inactive}
        `}
      >
        All tags
      </button>
      {flat.map(({
        node, depth,
      }) => (
        <button
          key={node.id}
          type="button"
          onClick={() => onSelect(node.id)}
          style={{
            paddingLeft: `${depth * 0.75 + 0.5}rem`,
          }}
          className={`
            ${item}
            ${activeId === node.id ? active : inactive}
          `}
        >
          <RomanizedLabel
            name={node.name}
            romanized={node.romanizedName}
          />
        </button>
      ))}
    </div>
  );
}
