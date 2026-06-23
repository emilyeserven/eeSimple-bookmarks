import type { YouTubeChannelCategory } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/lib/icons";
import { entityLinkTitle } from "@/lib/sidebarModifier";

/** A clickable pill showing a category's icon and name. Navigates to the category page; holds the modifier key to open in the sidebar. */
export function CategoryPill({
  category,
}: { category: YouTubeChannelCategory }) {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  return (
    <Link
      to="/categories/$categorySlug"
      params={{
        categorySlug: category.slug,
      }}
      title={entityLinkTitle(modifier)}
      onClick={event => viewClick(event, "category", category.id, category.slug)}
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
