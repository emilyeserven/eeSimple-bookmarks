import type { Category } from "@eesimple/types";

import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AddCategoryModal } from "../components/AddCategoryModal";
import { TaxonomyBulkBar } from "../components/bulk/TaxonomyBulkBar";
import { CategoryPreviewCard } from "../components/CategoryPreviewCard";
import { ListingStatusMessages } from "../components/ListingStatusMessages";
import { useCategoryColumns } from "../components/tables/categoryColumns";
import { listingSelectionColumn } from "../components/tables/selectionColumn";
import { useTableRowNav } from "../components/tables/useTableRowNav";
import { useBulkDeleteCategories, useCategories } from "../hooks/useCategories";
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { COLUMN_CLASS, useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";
import { useListSelection } from "../lib/useListSelection";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";

export const Route = createFileRoute("/categories/")({
  component: CategoriesListingPage,
});

/** Browse view for the Categories taxonomy: a searchable list with preview info; each row opens the category. */
function CategoriesListingPage() {
  const {
    data: categories, isLoading, error,
  } = useCategories();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("categories-listing", false, false, false, () => setModalOpen(true));
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns("categories-listing");
  const viewMode = useViewMode("categories-listing");
  const categoryColumns = useCategoryColumns();
  const rowNav = useTableRowNav();

  const allCategories = categories ?? [];
  const {
    rawQuery, hasQuery, filtered,
  } = useHeaderSearchFilter(
    allCategories,
    (category, query) => category.name.toLowerCase().includes(query)
      || (category.description ?? "").toLowerCase().includes(query),
  );

  const deletableIds = filtered.filter(c => !c.builtIn).map(c => c.id);
  const selection = useListSelection("categories-listing", deletableIds);
  useRegisterBulkSelect("categories-listing");
  const bulkDelete = useBulkDeleteCategories();

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
            <DataTable
              columns={[
                ...(selection.mode
                  ? [listingSelectionColumn<Category>(selection, c => c.id, c => !c.builtIn)]
                  : []),
                ...categoryColumns,
              ]}
              data={filtered}
              sortable
              onRowClick={(category, event) =>
                rowNav(event, "category", category.id, () => {
                  void navigate({
                    to: "/categories/$categorySlug",
                    params: {
                      categorySlug: category.slug,
                    },
                  });
                }, () => {
                  void navigate({
                    to: "/categories/$categorySlug/edit/general",
                    params: {
                      categorySlug: category.slug,
                    },
                  });
                })}
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
        onCreated={(category) => {
          void navigate({
            to: "/categories/$categorySlug/edit/general",
            params: {
              categorySlug: category.slug,
            },
          });
        }}
      />
    </section>
  );
}
