import { useState } from "react";

import { Plus } from "lucide-react";

import { TagCreateDrawer } from "./TagDrawer";
import { TagTreeList } from "./TagTreeList";
import { useTagTree } from "../hooks/useTags";

import { Button } from "@/components/ui/button";

/** Read-only tag taxonomy with a collapsible tree; editing happens inside per-tag drawers. */
export function TagManager() {
  const {
    data: tree, isLoading, error,
  } = useTagTree();

  // Empty set means every parent is collapsed by default.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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
      <div className="flex justify-end">
        <TagCreateDrawer>
          <Button
            type="button"
            size="sm"
          >
            <Plus className="size-4" />
            New tag
          </Button>
        </TagCreateDrawer>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading tags…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && tree && tree.length === 0
        ? <p className="text-muted-foreground">No tags yet. Add one with “New tag”.</p>
        : null}

      {tree && tree.length > 0
        ? (
          <TagTreeList
            tree={tree}
            expanded={expanded}
            onToggle={toggle}
          />
        )
        : null}
    </section>
  );
}
