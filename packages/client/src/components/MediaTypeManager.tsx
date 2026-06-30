import type { MediaTypeNode } from "@eesimple/types";

import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { ExpandAllToggle } from "./ExpandAllToggle";
import { MediaTypeTreeList } from "./MediaTypeTreeList";
import { useMediaTypeColumns } from "./tables/mediaTypeColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useExpandedSet } from "../hooks/useExpandedSet";
import { useBulkDeleteMediaTypes, useMediaTypeTree } from "../hooks/useMediaTypes";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { expandableIds } from "../lib/tagTree";
import { useListSelection } from "../lib/useListSelection";

import { DataTable } from "@/components/ui/data-table";

/** Flatten a media-type tree to `{ id, builtIn }` pairs for selection / select-all. */
function flattenMediaTypes(nodes: MediaTypeNode[]): { id: string;
  builtIn: boolean; }[] {
  return nodes.flatMap(node => [
    {
      id: node.id,
      builtIn: node.builtIn,
    },
    ...flattenMediaTypes(node.children),
  ]);
}

/** Browsable, collapsible media-type taxonomy tree. Shared by the Media Types taxonomy page and the Settings page. */
export function MediaTypesListing() {
  const {
    data: tree, isLoading, error,
  } = useMediaTypeTree();

  // Empty set means every parent is collapsed by default.
  const {
    expanded, onToggle, expandAll, collapseAll,
  } = useExpandedSet([]);
  const columns = useBookmarkColumns("media-types-listing");
  const viewMode = useViewMode("media-types-listing");
  const mediaTypeColumns = useMediaTypeColumns();
  const deletableIds = flattenMediaTypes(tree ?? []).filter(n => !n.builtIn).map(n => n.id);
  const selection = useListSelection("media-types-listing", deletableIds);
  useRegisterBulkSelect("media-types-listing");
  const bulkDelete = useBulkDeleteMediaTypes();
  const treeExpandableIds = expandableIds(tree ?? []);

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

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["media type", "media types"]}
      />

      {tree && tree.length > 0 && viewMode === "table"
        ? (
          <DataTable
            columns={[
              ...(selection.mode
                ? [listingSelectionColumn<MediaTypeNode>(selection, n => n.id, n => !n.builtIn)]
                : []),
              ...mediaTypeColumns,
            ]}
            data={tree}
            getSubRows={node => node.children}
          />
        )
        : null}

      {tree && tree.length > 0 && viewMode !== "table"
        ? (
          <>
            <div className="flex justify-end">
              <ExpandAllToggle
                expandableIds={treeExpandableIds}
                expanded={expanded}
                onExpandAll={expandAll}
                onCollapseAll={collapseAll}
              />
            </div>
            <MediaTypeTreeList
              tree={tree}
              expanded={expanded}
              onToggle={onToggle}
              columns={columns}
            />
          </>
        )
        : null}
    </div>
  );
}
