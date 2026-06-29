import type { TagNode } from "@eesimple/types";

import { useMemo, useState } from "react";

import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTagColumns } from "./tables/tagColumns";
import { TagTreeList } from "./TagTreeList";
import { useSortByRomanized } from "../hooks/useAppSettings";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useBulkDeleteTags, useTagTree } from "../hooks/useTags";
import { useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { flattenTree, sortTagTreeByRomanized } from "../lib/tagTree";
import { useListSelection } from "../lib/useListSelection";

import { DataTable } from "@/components/ui/data-table";

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
  const sortByRomanized = useSortByRomanized();
  const sortedTree = useMemo(
    () => sortTagTreeByRomanized(tree ?? [], sortByRomanized),
    [tree, sortByRomanized],
  );

  // Empty set means every parent is collapsed by default.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const columns = useBookmarkColumns("tags-listing");
  const viewMode = useViewMode("tags-listing");
  const tagColumns = useTagColumns();
  const deletableIds = flattenTree(tree ?? []).map(({
    node,
  }) => node.id);
  const selection = useListSelection("tags-listing", deletableIds);
  useRegisterBulkSelect("tags-listing");
  const bulkDelete = useBulkDeleteTags();

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

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["tag", "tags"]}
      />

      {tree && tree.length > 0 && viewMode === "table"
        ? (
          <DataTable
            columns={[
              ...(selection.mode ? [listingSelectionColumn<TagNode>(selection, n => n.id)] : []),
              ...tagColumns,
            ]}
            data={sortedTree}
            getSubRows={node => node.children}
          />
        )
        : null}

      {tree && tree.length > 0 && viewMode !== "table"
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
