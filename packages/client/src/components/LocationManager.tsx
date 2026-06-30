import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { LocationMapSection } from "./LocationMapSection";
import { LocationTableView } from "./LocationTableView";
import { LocationTreeView } from "./LocationTreeView";
import { useLocationsListing } from "../hooks/useLocationsListing";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** Browsable, collapsible location taxonomy tree. Shared by the Locations taxonomy page and the Settings page. */
export function LocationsListing() {
  const {
    tree, isLoading, error, expanded, onToggle, expandAll, expandMany, collapseAll, viewMode,
    deletableIds, selection, bulkDelete, sortMode, setSortMode, sortedTree,
    filterIds, setFilterIds, toggleFilterId,
  } = useLocationsListing();

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
            scope={{
              kind: "main",
            }}
            filter={{
              filterIds,
              onFilterChange: setFilterIds,
            }}
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
          <LocationTableView
            sortedTree={sortedTree}
            selection={selection}
          />
        )
        : null}

      {tree && tree.length > 0 && viewMode !== "table"
        ? (
          <LocationTreeView
            tree={tree}
            sortedTree={sortedTree}
            expanded={expanded}
            onToggle={onToggle}
            onExpandAll={expandAll}
            onExpandMany={expandMany}
            onCollapseAll={collapseAll}
            filterIds={filterIds}
            onToggleFilter={toggleFilterId}
          />
        )
        : null}
    </div>
  );
}
