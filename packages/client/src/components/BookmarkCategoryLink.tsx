import type { Category } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { CategoryIcon } from "@/lib/icons";

/** The bookmark's category rendered as an icon + name link that opens the category. */
export function BookmarkCategoryLink({
  category,
}: {
  category: Category;
}) {
  return (
    <Link
      to="/categories/$categorySlug"
      params={{
        categorySlug: category.slug,
      }}
      title={category.name}
      className="
        inline-flex items-center gap-1.5 text-primary
        hover:underline
      "
    >
      <CategoryIcon
        name={category.icon}
        className="size-3.5 shrink-0"
      />
      {category.name}
    </Link>
  );
}
