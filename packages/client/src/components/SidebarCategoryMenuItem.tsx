import type { Category } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { SidebarCountBadge } from "./SidebarCountBadge";

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { CategoryIcon } from "@/lib/icons";

/** One category link in the sidebar "Categories" section, with its count badge. */
export function SidebarCategoryMenuItem({
  category,
  pathname,
  sidebarState,
}: {
  category: Category;
  pathname: string;
  sidebarState: string;
}) {
  const isActive = pathname.startsWith(`/categories/${category.slug}`);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={category.name}
      >
        <Link
          to="/categories/$categorySlug"
          params={{
            categorySlug: category.slug,
          }}
          title={category.name}
        >
          <CategoryIcon name={category.icon} />
          <span>{category.name}</span>
        </Link>
      </SidebarMenuButton>
      <SidebarCountBadge
        count={category.bookmarkCount}
        sidebarState={sidebarState}
      />
    </SidebarMenuItem>
  );
}
