import { useState } from "react";

/**
 * A toggleable set of ids, seeded once from `initialIds`. Used by tree views (tag / media-type
 * hierarchy tabs) to track which nodes are expanded. `onToggle` flips a single id's membership.
 */
export function useExpandedSet(initialIds: string[]): {
  expanded: Set<string>;
  onToggle: (id: string) => void;
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

  return {
    expanded,
    onToggle,
  };
}
