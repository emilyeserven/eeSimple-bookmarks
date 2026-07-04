import type { Category } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { CategoryGeneralForm } from "./CategoryGeneralForm";
import { useEditPanelClick } from "./panel/useEditPanelClick";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { useDeleteCategory } from "../hooks/useCategories";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CategoryIcon } from "@/lib/icons";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";

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
  const modifier = useSidebarOpenModifier();
  const {
    t,
  } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CategoryIcon
            name={category.icon}
            className="size-5"
          />
          <h2 className="text-xl font-semibold">{category.name}</h2>
          {category.builtIn ? <Badge variant="secondary">{t("Built-in")}</Badge> : null}
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
              title={t("Edit (hold {{modifier}} to open in the sidebar)", {
                modifier: SIDEBAR_MODIFIER_LABELS[modifier],
              })}
              onClick={event => editClick(event, "category", category.id)}
            >
              {t("Edit")}
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
                {t("Delete")}
              </Button>
            )}
        </div>
      </div>

      <Separator />

      <CategoryGeneralForm category={category} />
    </div>
  );
}
