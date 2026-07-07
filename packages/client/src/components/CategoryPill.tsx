import type { YouTubeChannelCategory } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/lib/icons";

/** A clickable pill showing a category's icon and name. Navigates to the category page. */
export function CategoryPill({
  category,
}: { category: YouTubeChannelCategory }) {
  return (
    <Link
      to="/categories/$categorySlug"
      params={{
        categorySlug: category.slug,
      }}
      title={category.name}
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
