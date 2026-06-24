import type { TagNode } from "@eesimple/types";

import { useState } from "react";

import { flattenTree } from "../lib/tagTree";
import { Input } from "./ui/input";

interface TagPickerProps {
  tree: TagNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

/** Indented checkbox list for assigning a bookmark to any tier of the taxonomy. */
export function TagPicker({
  tree, selectedIds, onToggle,
}: TagPickerProps) {
  const [filterTerm, setFilterTerm] = useState("");
  const selected = new Set(selectedIds);
  const flat = flattenTree(tree);

  if (flat.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No tags yet. Create some on the Tags page.
      </p>
    );
  }

  const visible = filterTerm.trim()
    ? flat.filter(({
      node,
    }) => node.name.toLowerCase().includes(filterTerm.toLowerCase()))
    : flat;

  return (
    <>
      <Input
        placeholder="Filter tags…"
        value={filterTerm}
        onChange={e => setFilterTerm(e.target.value)}
        className="mb-2 h-7 text-sm"
      />
      {visible.length === 0
        ? (
          <p className="text-xs text-muted-foreground">No matching tags.</p>
        )
        : (
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {visible.map(({
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
        )}
    </>
  );
}
