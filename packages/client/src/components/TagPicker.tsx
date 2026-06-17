import type { TagNode } from "@eesimple/types";

import { flattenTree } from "../lib/tagTree";

interface TagPickerProps {
  tree: TagNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

/** Indented checkbox list for assigning a bookmark to any tier of the taxonomy. */
export function TagPicker({
  tree, selectedIds, onToggle,
}: TagPickerProps) {
  const selected = new Set(selectedIds);
  const flat = flattenTree(tree);

  if (flat.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No tags yet. Create some on the Tags page.
      </p>
    );
  }

  return (
    <ul className="max-h-40 space-y-1 overflow-y-auto">
      {flat.map(({
        node, depth,
      }) => (
        <li key={node.id}>
          <label
            className="flex items-center gap-2 text-sm text-foreground"
            style={{
              paddingLeft: `${depth * 1.25}rem`,
            }}
          >
            <input
              type="checkbox"
              checked={selected.has(node.id)}
              onChange={() => onToggle(node.id)}
            />
            {node.name}
          </label>
        </li>
      ))}
    </ul>
  );
}
