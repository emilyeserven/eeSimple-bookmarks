import { AddCustomPropertyModal } from "./AddCustomPropertyModal";
import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { CustomPropertyGrid } from "./CustomPropertyGrid";
import { CustomPropertyTable } from "./CustomPropertyTable";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { useCustomPropertyManager } from "../hooks/useCustomPropertyManager";

/** Searchable listing of custom properties, with previews that link out to the view/create pages. */
export function CustomPropertyManager() {
  const {
    properties, isLoading, error, modalOpen, setModalOpen, navigate, columns, viewMode,
    all, rawQuery, hasQuery, filtered, deletableIds, selection, bulkDelete,
  } = useCustomPropertyManager();

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

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["property", "properties"]}
      />

      {filtered.length > 0 && viewMode === "table"
        ? (
          <CustomPropertyTable
            filtered={filtered}
            selection={selection}
          />
        )
        : null}

      {viewMode !== "table"
        ? (
          <CustomPropertyGrid
            filtered={filtered}
            allProperties={properties ?? []}
            columns={columns}
            selection={selection}
          />
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
