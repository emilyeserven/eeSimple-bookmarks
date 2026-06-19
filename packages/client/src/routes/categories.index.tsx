import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AddCategoryModal } from "../components/AddCategoryModal";
import { CategoryPreviewCard } from "../components/CategoryPreviewCard";
import { useCategoryColumns } from "../components/tables/categoryColumns";
import { useTableRowNav } from "../components/tables/useTableRowNav";
import { useCategories } from "../hooks/useCategories";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { COLUMN_CLASS, useBookmarkColumns, useViewMode } from "../lib/bookmarkColumns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useUiStore } from "@/stores/uiStore";

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
  useSetListingPage("categories-listing");
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns("categories-listing");
  const viewMode = useViewMode("categories-listing");
  const categoryColumns = useCategoryColumns();
  const rowNav = useTableRowNav();

  const rawQuery = useUiStore(state => state.headerSearchQuery);
  const q = rawQuery.trim().toLowerCase();
  const filtered = (categories ?? []).filter((category) => {
    if (!q) return true;
    return category.name.toLowerCase().includes(q)
      || (category.description ?? "").toLowerCase().includes(q);
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Categories</h1>
            {categories
              ? <Badge variant="secondary">{categories.length}</Badge>
              : null}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="size-4" />
            New category
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Group bookmarks by category. Click a category to view it, or edit it for tiered tags,
          custom properties and autofill rules.
        </p>
      </div>

      <div className="space-y-4">
        {q && filtered.length < (categories?.length ?? 0)
          ? (
            <p className="text-sm text-muted-foreground">
              Showing {filtered.length} of {categories?.length ?? 0}
            </p>
          )
          : null}

        {isLoading ? <p className="text-muted-foreground">Loading categories…</p> : null}
        {error ? <p className="text-destructive">{error.message}</p> : null}
        {!isLoading && (categories?.length ?? 0) === 0
          ? <p className="text-muted-foreground">No categories yet.</p>
          : null}
        {!isLoading && (categories?.length ?? 0) > 0 && filtered.length === 0
          ? (
            <p className="text-muted-foreground">
              No categories match &ldquo;{rawQuery}&rdquo;.
            </p>
          )
          : null}

        {filtered.length > 0 && viewMode === "table"
          ? (
            <DataTable
              columns={categoryColumns}
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
