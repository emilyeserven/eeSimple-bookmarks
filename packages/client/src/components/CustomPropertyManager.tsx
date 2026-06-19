import { useMemo, useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AddCustomPropertyModal } from "./AddCustomPropertyModal";
import { PropertyPreview } from "./PropertyPreview";
import { useCustomPropertyColumns } from "./tables/customPropertyColumns";
import { useTableRowNav } from "./tables/useTableRowNav";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { COLUMN_CLASS, useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { TYPE_LABELS } from "../lib/propertyFormat";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useUiStore } from "@/stores/uiStore";

/** Searchable listing of custom properties, with previews that link out to the view/create pages. */
export function CustomPropertyManager() {
  const {
    data: properties, isLoading, error,
  } = useCustomProperties();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("custom-properties-listing");
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns("custom-properties-listing");
  const viewMode = useViewMode("custom-properties-listing");
  const propertyColumns = useCustomPropertyColumns();
  const rowNav = useTableRowNav();

  const rawQuery = useUiStore(state => state.headerSearchQuery);
  const filtered = useMemo(() => {
    const needle = rawQuery.trim().toLowerCase();
    const all = properties ?? [];
    if (!needle) return all;
    return all.filter(property =>
      property.name.toLowerCase().includes(needle)
      || TYPE_LABELS[property.type].toLowerCase().includes(needle));
  }, [properties, rawQuery]);

  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="size-4" />
          New property
        </Button>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading custom properties…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && !error && filtered.length === 0
        ? (
          <p className="text-muted-foreground">
            {rawQuery
              ? "No custom properties match your search."
              : "No custom properties yet. Create one to get started."}
          </p>
        )
        : null}

      {filtered.length > 0 && viewMode === "table"
        ? (
          <DataTable
            columns={propertyColumns}
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
