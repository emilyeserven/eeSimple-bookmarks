import { useState } from "react";

/**
 * A toggleable set of ids, seeded once from `initialIds`. Used by tree views (tag / media-type /
 * location hierarchy tabs and listings) to track which nodes are expanded. `onToggle` flips a single
 * id's membership; `expandAll` / `collapseAll` back the listing-wide "Expand all" toggle.
 */
export function useExpandedSet(initialIds: string[]): {
  expanded: Set<string>;
  onToggle: (id: string) => void;
  expandAll: (ids: string[]) => void;
  collapseAll: () => void;
} {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(initialIds));

  function onToggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      }
      else {
        next.add(id);
      }
      return next;
    });
  }

  function expandAll(ids: string[]) {
    setExpanded(new Set(ids));
  }

  function collapseAll() {
    setExpanded(new Set());
  }

  return {
    expanded,
    onToggle,
    expandAll,
    collapseAll,
  };
}
