import type { LocationNode } from "@eesimple/types";

import { useState } from "react";

import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { LocationMapSection } from "./LocationMapSection";
import { LocationTreeList } from "./LocationTreeList";
import { useLocationColumns } from "./tables/locationColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useBulkDeleteLocations, useLocationTree } from "../hooks/useLocations";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { useListSelection } from "../lib/useListSelection";

import { DataTable } from "@/components/ui/data-table";

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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const columns = useBookmarkColumns("locations-listing");
  const viewMode = useViewMode("locations-listing");
  const locationColumns = useLocationColumns();
  const deletableIds = flattenLocationIds(tree ?? []);
  const selection = useListSelection("locations-listing", deletableIds);
  useRegisterBulkSelect("locations-listing");
  const bulkDelete = useBulkDeleteLocations();

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
          />
        )
        : null}

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["location", "locations"]}
      />

      {tree && tree.length > 0 && viewMode === "table"
        ? (
          <DataTable
            columns={[
              ...(selection.mode
                ? [listingSelectionColumn<LocationNode>(selection, n => n.id)]
                : []),
              ...locationColumns,
            ]}
            data={tree}
            getSubRows={node => node.children}
          />
        )
        : null}

      {tree && tree.length > 0 && viewMode !== "table"
        ? (
          <LocationTreeList
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
