import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { CheckSquare, Plus } from "lucide-react";

import { AddCategoryModal } from "./AddCategoryModal";
import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { CategorySelectableCard } from "./CategorySelectableCard";
import { useBulkDeleteCategories, useCategories } from "../hooks/useCategories";
import { useListSelection } from "../lib/useListSelection";

import { Button } from "@/components/ui/button";

/** Create and list categories; each row links to a category's full edit page. */
export function CategoryManager() {
  const {
    data: categories, isLoading, error,
  } = useCategories();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const deletableIds = (categories ?? []).filter(c => !c.builtIn).map(c => c.id);
  const selection = useListSelection("categories-listing", deletableIds);
  const bulkDelete = useBulkDeleteCategories();

  return (
    <section className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button
          variant={selection.mode ? "secondary" : "outline"}
          size="sm"
          onClick={() => selection.setMode(!selection.mode)}
        >
          <CheckSquare className="size-4" />
          {selection.mode ? "Done selecting" : "Select"}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="size-4" />
          New category
        </Button>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading categories…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && (categories?.length ?? 0) === 0
        ? <p className="text-muted-foreground">No categories yet.</p>
        : null}

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["category", "categories"]}
      />

      <div className="space-y-4">
        {(categories ?? []).map(category => (
          <CategorySelectableCard
            key={category.id}
            category={category}
            selected={selection.isSelected(category.id)}
            inSelectionMode={selection.mode}
            onSelectToggle={() => selection.toggle(category.id)}
          />
        ))}
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
