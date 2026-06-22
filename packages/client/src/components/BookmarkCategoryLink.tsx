import type { Category } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { CategoryIcon } from "@/lib/icons";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";

/** The bookmark's category rendered as an icon + name link that opens the category (or its panel). */
export function BookmarkCategoryLink({
  category,
}: {
  category: Category;
}) {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  return (
    <Link
      to="/categories/$categorySlug"
      params={{
        categorySlug: category.slug,
      }}
      title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
      onClick={event => viewClick(event, "category", category.id)}
      className="
        inline-flex items-center gap-1.5 text-primary
        hover:underline
      "
    >
      <CategoryIcon
        name={category.icon}
        className="size-4 shrink-0"
      />
      {category.name}
    </Link>
  );
}
