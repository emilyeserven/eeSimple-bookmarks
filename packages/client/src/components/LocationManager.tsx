import type { LocationNode } from "@eesimple/types";

import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { ExpandAllToggle } from "./ExpandAllToggle";
import { LocationMapSection } from "./LocationMapSection";
import { LocationTreeList } from "./LocationTreeList";
import { useLocationColumns } from "./tables/locationColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { usePlaceTypeDisplayConfig } from "../hooks/useAppSettings";
import { useExpandedSet } from "../hooks/useExpandedSet";
import { useBulkDeleteLocations, useLocationTree } from "../hooks/useLocations";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { sortLocationTree } from "../lib/locationSort";
import { expandableIds } from "../lib/tagTree";
import { useListSelection } from "../lib/useListSelection";
import { useUiStore } from "../stores/uiStore";

import { DataTable } from "@/components/ui/data-table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** Flatten a location tree to its ids for selection / select-all. */
function flattenLocationIds(nodes: LocationNode[]): string[] {
  return nodes.flatMap(node => [node.id, ...flattenLocationIds(node.children)]);
}

/** Browsable, collapsible location taxonomy tree. Shared by the Locations taxonomy page and the Settings page. */
export function LocationsListing() {
  const {
    data: tree, isLoading, error,
  } = useLocationTree();

  // Empty set means every parent is collapsed by default.
  const {
    expanded, onToggle, expandAll, collapseAll,
  } = useExpandedSet([]);
  const columns = useBookmarkColumns("locations-listing");
  const viewMode = useViewMode("locations-listing");
  const locationColumns = useLocationColumns();
  const deletableIds = flattenLocationIds(tree ?? []);
  const selection = useListSelection("locations-listing", deletableIds);
  useRegisterBulkSelect("locations-listing");
  const bulkDelete = useBulkDeleteLocations();
  const treeExpandableIds = expandableIds(tree ?? []);

  const sortMode = useUiStore(state => state.locationSortMode);
  const setSortMode = useUiStore(state => state.setLocationSortMode);
  const displayConfig = usePlaceTypeDisplayConfig();
  const sortedTree = sortLocationTree(tree ?? [], sortMode, displayConfig);

  return (
    <div className="space-y-4">
      {isLoading ? <p className="text-muted-foreground">Loading locations…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && tree && tree.length === 0
        ? (
          <p className="text-muted-foreground">
            No locations yet.
          </p>
        )
        : null}

      {tree && tree.length > 0
        ? (
          <LocationMapSection
            mapKey="listing"
            tree={tree}
            showLevels
          />
        )
        : null}

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["location", "locations"]}
      />

      {tree && tree.length > 0
        ? (
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm text-muted-foreground">Sort</span>
            <ToggleGroup
              type="single"
              size="sm"
              variant="outline"
              value={sortMode}
              onValueChange={(value) => {
                if (value === "default" || value === "place-type") setSortMode(value);
              }}
              aria-label="Sort locations"
            >
              <ToggleGroupItem value="default">Default</ToggleGroupItem>
              <ToggleGroupItem value="place-type">Place type</ToggleGroupItem>
            </ToggleGroup>
          </div>
        )
        : null}

      {tree && tree.length > 0 && viewMode === "table"
        ? (
          <DataTable
            columns={[
              ...(selection.mode
                ? [listingSelectionColumn<LocationNode>(selection, n => n.id)]
                : []),
              ...locationColumns,
            ]}
            data={sortedTree}
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
            <LocationTreeList
              tree={sortedTree}
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
