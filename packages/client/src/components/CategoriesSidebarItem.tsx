import type { Category } from "@eesimple/types";

import { useRef, useState } from "react";

import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SidebarCountBadge } from "./SidebarCountBadge";
import { useIsMobile } from "../hooks/use-mobile";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { CategoryIcon } from "@/lib/icons";

/** One starred-category shortcut — shared by the desktop popover + the mobile inline list. */
function StarredCategoryLink({
  category,
  onNavigate,
}: {
  category: Category;
  onNavigate: () => void;
}) {
  return (
    <Link
      to="/categories/$categorySlug"
      params={{
        categorySlug: category.slug,
      }}
      onClick={onNavigate}
      className="
        flex items-center gap-2 rounded-md px-2 py-1.5 text-sm
        hover:bg-accent hover:text-accent-foreground
      "
    >
      <CategoryIcon
        name={category.icon}
        className="size-3.5 shrink-0 text-muted-foreground"
      />
      <span className="flex-1 truncate">{category.name}</span>
      {category.bookmarkCount != null && category.bookmarkCount > 0
        ? (
          <Badge
            variant="secondary"
            className="shrink-0"
          >
            {category.bookmarkCount}
          </Badge>
        )
        : null}
    </Link>
  );
}

/**
 * The sidebar "Categories" entry with a hover flyout surfacing the user's starred categories. On
 * desktop, hovering the button (or the flyout) opens a popover to the right; on mobile the chevron
 * doubles as an expand toggle. Clicking the button still navigates to the Categories listing. When
 * no categories are starred, renders as a plain link with no flyout. Mirrors {@link GroupsSidebarItem}.
 */
export function CategoriesSidebarItem({
  pathname,
  categoriesCount,
  starredCategories,
  sidebarState,
}: {
  pathname: string;
  categoriesCount?: number;
  starredCategories: Category[];
  sidebarState?: string;
}) {
  const {
    t,
  } = useTranslation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = pathname.startsWith("/categories");
  const hasStarred = starredCategories.length > 0;
  const showTrailingContent = sidebarState !== "collapsed";

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openNow() {
    cancelClose();
    setOpen(true);
  }

  function closeSoon() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  const categoriesButton = (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      tooltip={t("Categories")}
    >
      <Link to="/categories">
        <FolderOpen />
        <span className="flex-1 truncate">{t("Categories")}</span>
        {showTrailingContent && categoriesCount != null && categoriesCount > 0
          ? (
            <Badge
              variant="secondary"
              className="shrink-0"
            >
              {categoriesCount}
            </Badge>
          )
          : null}
        {/* Signals the hover flyout even before the user hovers — desktop only, only when starred. */}
        {showTrailingContent && hasStarred && !isMobile
          ? (
            <ChevronRight
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          )
          : null}
      </Link>
    </SidebarMenuButton>
  );

  // No starred categories → a plain link, no flyout affordance.
  if (!hasStarred) {
    return (
      <SidebarMenuItem>
        {categoriesButton}
        <SidebarCountBadge
          count={categoriesCount}
          sidebarState={sidebarState ?? "expanded"}
        />
      </SidebarMenuItem>
    );
  }

  // On touch, expand the shortcuts inline below the button rather than relying on a hover popover.
  if (isMobile) {
    return (
      <>
        <SidebarMenuItem>
          {categoriesButton}
          <SidebarMenuAction
            aria-label={expanded ? t("Hide starred categories") : t("Show starred categories")}
            onClick={() => setExpanded(value => !value)}
          >
            <ChevronDown
              className={`
                transition-transform duration-200
                ${expanded ? "" : "-rotate-90"}
              `}
            />
          </SidebarMenuAction>
        </SidebarMenuItem>
        {expanded
          ? (
            <SidebarMenuItem className="px-1 pb-1">
              <div className="flex flex-col gap-0.5">
                {starredCategories.map(category => (
                  <StarredCategoryLink
                    key={category.id}
                    category={category}
                    onNavigate={() => setExpanded(false)}
                  />
                ))}
              </div>
            </SidebarMenuItem>
          )
          : null}
      </>
    );
  }

  return (
    <SidebarMenuItem>
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverAnchor asChild>
          <div
            onMouseEnter={openNow}
            onMouseLeave={closeSoon}
          >
            {categoriesButton}
          </div>
        </PopoverAnchor>
        <PopoverContent
          side="right"
          align="start"
          className="w-56 p-2"
          onOpenAutoFocus={e => e.preventDefault()}
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
        >
          <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
            {t("Starred Categories")}
          </p>
          {starredCategories.map(category => (
            <StarredCategoryLink
              key={category.id}
              category={category}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
}
