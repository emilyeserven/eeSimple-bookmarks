import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AddCategoryModal } from "./AddCategoryModal";
import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { CategoryCard } from "./CategoryCard";
import { useBulkDeleteCategories, useCategories } from "../hooks/useCategories";
import { useListSelection } from "../lib/useListSelection";

import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

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
      <div className="flex justify-end">
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
        {(categories ?? []).map((category) => {
          const selected = selection.isSelected(category.id);
          return (
            <RowCard
              key={category.id}
              className={cn("group relative p-4", selected && `
                ring-2 ring-primary
              `)}
            >
              {!category.builtIn
                ? (
                  <div
                    className={cn(
                      `
                        absolute top-3 left-3 z-10 opacity-0 transition-opacity
                        group-hover:opacity-100
                        focus-within:opacity-100
                      `,
                      selected && "opacity-100",
                    )}
                  >
                    <Checkbox
                      aria-label={`Select ${category.name}`}
                      checked={selected}
                      onCheckedChange={() => selection.toggle(category.id)}
                    />
                  </div>
                )
                : null}
              <CategoryCard category={category} />
            </RowCard>
          );
        })}
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
