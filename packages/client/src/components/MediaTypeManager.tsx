import { useState } from "react";

import { MediaTypeTreeList } from "./MediaTypeTreeList";
import { useMediaTypeTree } from "../hooks/useMediaTypes";
import { useBookmarkColumns } from "../lib/bookmarkColumns";

/** Browsable, collapsible media-type taxonomy tree. Shared by the Media Types taxonomy page and the Settings page. */
export function MediaTypesListing() {
  const {
    data: tree, isLoading, error,
  } = useMediaTypeTree();

  // Empty set means every parent is collapsed by default.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const columns = useBookmarkColumns("media-types-listing");

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {isLoading ? <p className="text-muted-foreground">Loading media types…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && tree && tree.length === 0
        ? (
          <p className="text-muted-foreground">
            No media types yet.
          </p>
        )
        : null}

      {tree && tree.length > 0
        ? (
          <MediaTypeTreeList
            tree={tree}
            expanded={expanded}
            onToggle={toggle}
            columns={columns}
          />
        )
        : null}
    </div>
  );
}
