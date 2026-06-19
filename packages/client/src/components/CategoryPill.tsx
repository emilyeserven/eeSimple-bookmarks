import type { YouTubeChannelCategory } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { useViewPanelClick } from "./panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/lib/icons";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** A clickable pill showing a category's icon and name. Navigates to the category page; holds the modifier key to open in the sidebar. */
export function CategoryPill({
  category,
}: { category: YouTubeChannelCategory }) {
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  return (
    <Link
      to="/categories/$categorySlug"
      params={{
        categorySlug: category.slug,
      }}
      title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
      onClick={event => viewClick(event, "category", category.id)}
    >
      <Badge
        variant="secondary"
        className="inline-flex items-center gap-1"
      >
        <CategoryIcon
          name={category.icon}
          className="size-3 shrink-0"
        />
        {category.name}
      </Badge>
    </Link>
  );
}
