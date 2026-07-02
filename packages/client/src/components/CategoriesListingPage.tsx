import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { AddCategoryModal } from "./AddCategoryModal";
import { ListingScaffold } from "./ListingScaffold";

import { Badge } from "@/components/ui/badge";
import { categoryListingConfig } from "@/entities/category";
import { useSetListingPage } from "@/hooks/useListingPage";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browse view for the Categories taxonomy: a searchable list with preview info; each row opens the category. */
export function CategoriesListingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("categories-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: "New category",
  });
  const state = useListingScaffold(categoryListingConfig);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Categories</h1>
          {!state.isLoading
            ? <Badge variant="secondary">{state.items.length}</Badge>
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Group bookmarks by category. Click a category to view it, or edit it for tiered tags,
          custom properties and autofill rules.
        </p>
      </div>

      <ListingScaffold
        config={categoryListingConfig}
        state={state}
      />

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
