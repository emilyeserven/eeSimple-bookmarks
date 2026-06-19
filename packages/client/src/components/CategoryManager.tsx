import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AddCategoryModal } from "./AddCategoryModal";
import { CategoryCard } from "./CategoryCard";
import { useCategories } from "../hooks/useCategories";

import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";

/** Create and list categories; each row links to a category's full edit page. */
export function CategoryManager() {
  const {
    data: categories, isLoading, error,
  } = useCategories();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <section className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="size-4" />
          New category
        </Button>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading categories…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && (categories?.length ?? 0) === 0
        ? <p className="text-muted-foreground">No categories yet.</p>
        : null}

      <div className="space-y-4">
        {(categories ?? []).map(category => (
          <RowCard
            key={category.id}
            className="p-4"
          >
            <CategoryCard category={category} />
          </RowCard>
        ))}
      </div>

      <AddCategoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(category) => {
          void navigate({
            to: "/categories/$categorySlug/edit/general",
            params: { categorySlug: category.slug },
          });
        }}
      />
    </section>
  );
}
