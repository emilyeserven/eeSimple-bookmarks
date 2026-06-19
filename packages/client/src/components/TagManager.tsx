import { useState } from "react";

import { TagTreeList } from "./TagTreeList";
import { useTagTree } from "../hooks/useTags";
import { useBookmarkColumns } from "../lib/bookmarkColumns";

interface TagManagerProps {
  onNew?: () => void;
}

/** Read-only tag taxonomy with a collapsible tree; editing happens inside per-tag drawers. */
export function TagManager({
  onNew,
}: TagManagerProps) {
  const {
    data: tree, isLoading, error,
  } = useTagTree();

  // Empty set means every parent is collapsed by default.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const columns = useBookmarkColumns("tags-listing");

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="space-y-4">
      {isLoading ? <p className="text-muted-foreground">Loading tags&#8230;</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && tree && tree.length === 0
        ? (
          <p className="text-muted-foreground">
            {"No tags yet. "}
            <button
              type="button"
              className="
                underline
                hover:no-underline
              "
              onClick={onNew}
            >
              Add your first tag.
            </button>
          </p>
        )
        : null}

      {tree && tree.length > 0
        ? (
          <TagTreeList
            tree={tree}
            expanded={expanded}
            onToggle={toggle}
            columns={columns}
          />
        )
        : null}

    </section>
  );
}
