import type { CustomProperty } from "@eesimple/types";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { CheckSquare } from "lucide-react";

import { AddCustomPropertyModal } from "./AddCustomPropertyModal";
import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { PropertyPreview } from "./PropertyPreview";
import { useCustomPropertyColumns } from "./tables/customPropertyColumns";
import { listingSelectionColumn } from "./tables/selectionColumn";
import { useTableRowNav } from "./tables/useTableRowNav";
import { useBulkDeleteCustomProperties, useCustomProperties } from "../hooks/useCustomProperties";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { COLUMN_CLASS, useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { TYPE_LABELS } from "../lib/propertyFormat";
import { useListSelection } from "../lib/useListSelection";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";

/** Searchable listing of custom properties, with previews that link out to the view/create pages. */
export function CustomPropertyManager() {
  const {
    data: properties, isLoading, error,
  } = useCustomProperties();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("custom-properties-listing", false, false, false, () => setModalOpen(true));
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns("custom-properties-listing");
  const viewMode = useViewMode("custom-properties-listing");
  const propertyColumns = useCustomPropertyColumns();
  const rowNav = useTableRowNav();

  const all = properties ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    all,
    (property, query) => property.name.toLowerCase().includes(query)
      || TYPE_LABELS[property.type].toLowerCase().includes(query),
  );

  const deletableIds = filtered.filter(p => !p.builtIn).map(p => p.id);
  const selection = useListSelection("custom-properties-listing", deletableIds);
  const bulkDelete = useBulkDeleteCustomProperties();

  return (
    <section className="space-y-4">
      <ListingStatusMessages
        isLoading={isLoading}
        error={error}
        totalCount={all.length}
        filteredCount={filtered.length}
        rawQuery={rawQuery}
        hasQuery={hasQuery}
        loadingLabel="Loading custom properties…"
        entityPlural="custom properties"
        emptyMessage={(
          <p className="text-muted-foreground">
            No custom properties yet. Create one to get started.
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
        noun={["property", "properties"]}
      />

      {filtered.length > 0 && viewMode === "table"
        ? (
          <DataTable
            columns={[
              ...(selection.mode ? [listingSelectionColumn<CustomProperty>(selection, p => p.id, p => !p.builtIn)] : []),
              ...propertyColumns,
            ]}
            data={filtered}
            sortable
            onRowClick={(property, event) =>
              rowNav(event, "property", property.id, () => {
                void navigate({
                  to: "/custom-properties/$propertySlug",
                  params: {
                    propertySlug: property.slug,
                  },
                });
              }, () => {
                void navigate({
                  to: "/custom-properties/$propertySlug/edit/general",
                  params: {
                    propertySlug: property.slug,
                  },
                });
              })}
          />
        )
        : null}

      {viewMode !== "table"
        ? (
          <div
            className={`
              grid gap-3
              ${COLUMN_CLASS[columns]}
            `}
          >
            {filtered.map(property => (
              <PropertyPreview
                key={property.id}
                property={property}
                allProperties={properties ?? []}
                selectable={!property.builtIn}
                selected={selection.isSelected(property.id)}
                onSelectToggle={() => selection.toggle(property.id)}
                inSelectionMode={selection.mode}
              />
            ))}
          </div>
        )
        : null}

      <AddCustomPropertyModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(property) => {
          void navigate({
            to: "/custom-properties/$propertySlug/edit/general",
            params: {
              propertySlug: property.slug,
            },
          });
        }}
      />
    </section>
  );
}
