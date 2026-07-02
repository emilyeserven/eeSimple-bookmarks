import type { Category, SidebarOpenModifier } from "@eesimple/types";
import type { MouseEvent } from "react";

import { Link } from "@tanstack/react-router";

import { SidebarCountBadge } from "./SidebarCountBadge";

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { CategoryIcon } from "@/lib/icons";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";

/** One category link in the sidebar "Categories" section, with its count badge. */
export function SidebarCategoryMenuItem({
  category,
  pathname,
  modifier,
  sidebarState,
  onViewClick,
}: {
  category: Category;
  pathname: string;
  modifier: SidebarOpenModifier;
  sidebarState: string;
  onViewClick: (event: MouseEvent, id: string) => void;
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
          title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
          onClick={event => onViewClick(event, category.id)}
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
