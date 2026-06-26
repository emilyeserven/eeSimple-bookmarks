import type { PropertyGroup } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { CheckSquare } from "lucide-react";

import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { PropertyGroupListItem } from "./PropertyGroupListItem";
import { usePropertyGroupColumns } from "./tables/propertyGroupColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useBulkDeletePropertyGroups, usePropertyGroups } from "../hooks/usePropertyGroups";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { COLUMN_CLASS, useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { useListSelection } from "../lib/useListSelection";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";

/** Browsable, searchable property-group listing. */
export function PropertyGroupsListing() {
  const {
    data: allGroups, isLoading, error,
  } = usePropertyGroups();
  useSetListingPage("property-groups-listing");
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns("property-groups-listing");
  const viewMode = useViewMode("property-groups-listing");
  const groupColumns = usePropertyGroupColumns();
  const rowNav = useTableRowNav();
  const navigate = useNavigate();

  const groups = allGroups ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    groups,
    (g, query) => g.name.toLowerCase().includes(query) || g.slug.toLowerCase().includes(query),
  );

  const deletableIds = filtered.map(g => g.id);
  const selection = useListSelection("property-groups-listing", deletableIds);
  const bulkDelete = useBulkDeletePropertyGroups();

  return (
    <div className="space-y-4">
      <ListingStatusMessages
        isLoading={isLoading}
        error={error}
        totalCount={groups.length}
        filteredCount={filtered.length}
        rawQuery={rawQuery}
        hasQuery={hasQuery}
        loadingLabel="Loading property groups…"
        entityPlural="property groups"
        emptyMessage={(
          <p className="text-muted-foreground">
            No property groups yet.
          </p>
        )}
      />

      {viewMode !== "table"
        ? (
          <div className="flex justify-end">
            <Button
              variant={selection.mode ? "secondary" : "outline"}
              size="sm"
              onClick={() => selection.setMode(!selection.mode)}
            >
              <CheckSquare className="size-4" />
              {selection.mode ? "Done selecting" : "Select"}
            </Button>
          </div>
        )
        : null}

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["property group", "property groups"]}
      />

      {filtered.length > 0 && viewMode === "table"
        ? (
          <DataTable
            columns={[
              ...(selection.mode ? [listingSelectionColumn<PropertyGroup>(selection, g => g.id)] : []),
              ...groupColumns,
            ]}
            data={filtered}
            sortable
            onRowClick={(group, event) =>
              rowNav(event, "property-group", group.id, () => {
                void navigate({
                  to: "/taxonomies/property-groups/$propertyGroupSlug",
                  params: {
                    propertyGroupSlug: group.slug,
                  },
                });
              }, () => {
                void navigate({
                  to: "/taxonomies/property-groups/$propertyGroupSlug/edit/general",
                  params: {
                    propertyGroupSlug: group.slug,
                  },
                });
              })}
          />
        )
        : null}

      {filtered.length > 0 && viewMode !== "table"
        ? (
          <div
            className={`
              grid gap-2
              ${COLUMN_CLASS[columns]}
            `}
          >
            {filtered.map(group => (
              <PropertyGroupListItem
                key={group.id}
                group={group}
                selectable
                selected={selection.isSelected(group.id)}
                onSelectToggle={() => selection.toggle(group.id)}
                inSelectionMode={selection.mode}
              />
            ))}
          </div>
        )
        : null}
    </div>
  );
}
