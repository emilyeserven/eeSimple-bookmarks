import * as React from "react";

import { Link, useRouterState } from "@tanstack/react-router";
import { Bookmark, Globe, Home, Settings, Tags } from "lucide-react";

import { useCategories } from "../hooks/useCategories";
import { useUiStore } from "../stores/uiStore";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { CategoryIcon } from "@/lib/icons";

const navItems = [
  {
    title: "Home",
    to: "/",
    icon: Home,
  },
  {
    title: "Bookmarks",
    to: "/bookmarks",
    icon: Bookmark,
  },
] as const;

const taxonomyItems = [
  {
    key: "tags",
    title: "Tags",
    to: "/taxonomies/tags",
    icon: Tags,
  },
  {
    key: "websites",
    title: "Websites",
    to: "/taxonomies/websites",
    icon: Globe,
  },
] as const;

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });
  const {
    data: categories,
  } = useCategories();
  const hiddenCategoryIds = useUiStore(state => state.hiddenCategoryIds);
  const hiddenTaxonomyItems = useUiStore(state => state.hiddenTaxonomyItems);

  return (
    <Sidebar
      collapsible="icon"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
            >
              <Link to="/">
                <div
                  className="
                    flex aspect-square size-8 items-center justify-center
                    rounded-lg bg-sidebar-primary
                    text-sidebar-primary-foreground
                  "
                >
                  <Bookmark className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm/tight">
                  <span className="truncate font-semibold">eeSimple</span>
                  <span className="truncate text-xs">Bookmarks</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive
                  = item.to === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(() => {
          const visibleCategories = (categories ?? []).filter(
            c => !hiddenCategoryIds.includes(c.id),
          );
          return visibleCategories.length > 0
            ? (
              <SidebarGroup>
                <SidebarGroupLabel>Categories</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleCategories.map((category) => {
                      const isActive = pathname === `/categories/${category.slug}`;
                      return (
                        <SidebarMenuItem key={category.id}>
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
                            >
                              <CategoryIcon name={category.icon} />
                              <span>{category.name}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )
            : null;
        })()}

        {(() => {
          const visibleTaxonomyItems = taxonomyItems.filter(
            item => !hiddenTaxonomyItems.includes(item.key),
          );
          return visibleTaxonomyItems.length > 0
            ? (
              <SidebarGroup>
                <SidebarGroupLabel>Taxonomies</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleTaxonomyItems.map((item) => {
                      const isActive = pathname.startsWith(item.to);
                      return (
                        <SidebarMenuItem key={item.to}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.title}
                          >
                            <Link to={item.to}>
                              <item.icon />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )
            : null;
        })()}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              isActive={pathname.startsWith("/settings")}
              tooltip="Settings"
            >
              <Link to="/settings">
                <div
                  className="
                    flex aspect-square size-8 items-center justify-center
                    rounded-lg bg-sidebar-primary
                    text-sidebar-primary-foreground
                  "
                >
                  <Settings className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm/tight">
                  <span className="truncate font-semibold">Settings</span>
                  <span className="truncate text-xs">Manage preferences</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
