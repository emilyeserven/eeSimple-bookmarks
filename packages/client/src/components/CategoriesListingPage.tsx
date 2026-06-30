import { AddCategoryModal } from "./AddCategoryModal";
import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { CategoriesTable } from "./CategoriesTable";
import { CategoryPreviewCard } from "./CategoryPreviewCard";
import { ListingStatusMessages } from "./ListingStatusMessages";
import { useCategoriesListing } from "./useCategoriesListing";
import { COLUMN_CLASS } from "../lib/bookmarkColumns";

import { Badge } from "@/components/ui/badge";

/** Browse view for the Categories taxonomy: a searchable list with preview info; each row opens the category. */
export function CategoriesListingPage() {
  const {
    categories,
    isLoading,
    error,
    allCategories,
    filtered,
    rawQuery,
    hasQuery,
    columns,
    viewMode,
    selection,
    deletableIds,
    bulkDelete,
    modalOpen,
    setModalOpen,
    goToEdit,
    goToView,
  } = useCategoriesListing();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Categories</h1>
          {categories
            ? <Badge variant="secondary">{categories.length}</Badge>
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Group bookmarks by category. Click a category to view it, or edit it for tiered tags,
          custom properties and autofill rules.
        </p>
      </div>

      <div className="space-y-4">
        <ListingStatusMessages
          isLoading={isLoading}
          error={error}
          totalCount={allCategories.length}
          filteredCount={filtered.length}
          rawQuery={rawQuery}
          hasQuery={hasQuery}
          loadingLabel="Loading categories…"
          entityPlural="categories"
          emptyMessage={<p className="text-muted-foreground">No categories yet.</p>}
        />

        <TaxonomyBulkBar
          selection={selection}
          totalSelectable={deletableIds.length}
          bulkDelete={bulkDelete}
          noun={["category", "categories"]}
        />

        {filtered.length > 0 && viewMode === "table"
          ? (
            <CategoriesTable
              data={filtered}
              selection={selection}
              onView={goToView}
              onEdit={goToEdit}
            />
          )
          : null}

        {filtered.length > 0 && viewMode !== "table"
          ? (
            <ul
              className={`
                grid gap-2
                ${COLUMN_CLASS[columns]}
              `}
            >
              {filtered.map(category => (
                <CategoryPreviewCard
                  key={category.id}
                  category={category}
                  variant="row"
                  selectable={!category.builtIn}
                  selected={selection.isSelected(category.id)}
                  onSelectToggle={() => selection.toggle(category.id)}
                  inSelectionMode={selection.mode}
                />
              ))}
            </ul>
          )
          : null}
      </div>

      <AddCategoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={category => goToEdit(category.slug)}
      />
    </section>
  );
}
