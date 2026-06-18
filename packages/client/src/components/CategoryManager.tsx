import type { Category } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { AddCategoryForm } from "./AddCategoryForm";
import { CategoryGeneralForm } from "./CategoryGeneralForm";
import { useEditPanelClick } from "./panel/useEditPanelClick";
import {
  useCategories,
  useDeleteCategory,
} from "../hooks/useCategories";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CategoryIcon } from "@/lib/icons";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** Create and list categories; each row links to a category's full edit page. */
export function CategoryManager() {
  const {
    data: categories, isLoading, error,
  } = useCategories();

  return (
    <section className="space-y-6">
      <AddCategoryForm />

      {isLoading ? <p className="text-muted-foreground">Loading categories…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && (categories?.length ?? 0) === 0
        ? <p className="text-muted-foreground">No categories yet. Create one above.</p>
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
    </section>
  );
}

interface CategoryCardProps {
  category: Category;
  /** Called after a successful delete — e.g. the panel uses it to dismiss itself. */
  onDeleted?: () => void;
}

/** A category row with quick edit (name, icon, description) and a link to its full edit page. */
export function CategoryCard({
  category, onDeleted,
}: CategoryCardProps) {
  const deleteCategory = useDeleteCategory();
  const editClick = useEditPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CategoryIcon
            name={category.icon}
            className="size-5"
          />
          <h2 className="text-xl font-semibold">{category.name}</h2>
          {category.builtIn ? <Badge variant="secondary">Built-in</Badge> : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link
              to="/categories/$categorySlug/edit/general"
              params={{
                categorySlug: category.slug,
              }}
              title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
              onClick={event => editClick(event, "category", category.id)}
            >
              Edit
            </Link>
          </Button>
          {category.builtIn
            ? null
            : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => deleteCategory.mutate(category.id, {
                  onSuccess: onDeleted,
                })}
              >
                Delete
              </Button>
            )}
        </div>
      </div>

      <Separator />

      <CategoryGeneralForm category={category} />
    </div>
  );
}
