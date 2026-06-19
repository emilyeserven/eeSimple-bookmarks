import * as React from "react";

import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bookmark,
  Clapperboard,
  FolderOpen,
  Globe,
  Home,
  Layers,
  MonitorPlay,
  Settings,
  SlidersHorizontal,
  Tags,
  Wand2,
} from "lucide-react";

import { CollapsibleSection, SidebarNavSection, SidebarResizeHandle, useViewPanelClick } from "./app-sidebar-sections";
import { useCategories } from "../hooks/useCategories";
import { useUiStore } from "../stores/uiStore";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { CategoryIcon } from "@/lib/icons";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";

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
    key: "categories",
    title: "Categories",
    to: "/categories",
    icon: FolderOpen,
  },
  {
    key: "tags",
    title: "Tags",
    to: "/tags",
    icon: Tags,
  },
  {
    key: "websites",
    title: "Websites",
    to: "/taxonomies/websites",
    icon: Globe,
  },
  {
    key: "media-types",
    title: "Media Types",
    to: "/taxonomies/media-types",
    icon: Clapperboard,
  },
  {
    key: "youtube-channels",
    title: "YouTube Channels",
    to: "/taxonomies/youtube-channels",
    icon: MonitorPlay,
  },
] as const;

const customizationItems = [
  {
    key: "custom-properties",
    title: "Custom Properties",
    to: "/custom-properties",
    icon: SlidersHorizontal,
  },
  {
    key: "property-groups",
    title: "Property Groups",
    to: "/taxonomies/property-groups",
    icon: Layers,
  },
  {
    key: "autofill",
    title: "Autofill Rules",
    to: "/autofill",
    icon: Wand2,
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
  const hiddenCustomizationItems = useUiStore(state => state.hiddenCustomizationItems);
  const hiddenSidebarGroups = useUiStore(state => state.hiddenSidebarGroups);
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  const viewClick = useViewPanelClick();

  const visibleCategories = (categories ?? []).filter(
    c => !hiddenCategoryIds.includes(c.id),
  );
  const visibleTaxonomyItems = taxonomyItems.filter(
    item => !hiddenTaxonomyItems.includes(item.key),
  );
  const visibleCustomizationItems = customizationItems.filter(
    item => !hiddenCustomizationItems.includes(item.key),
  );

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

        {!hiddenSidebarGroups.includes("categories") && visibleCategories.length > 0
          ? (
            <CollapsibleSection
              sectionKey="categories"
              label="Categories"
            >
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
                          title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
                          onClick={event => viewClick(event, "category", category.id)}
                        >
                          <CategoryIcon name={category.icon} />
                          <span>{category.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </CollapsibleSection>
          )
          : null}

        {!hiddenSidebarGroups.includes("taxonomies") && visibleTaxonomyItems.length > 0
          ? (
            <SidebarNavSection
              sectionKey="taxonomies"
              label="Taxonomies"
              items={visibleTaxonomyItems}
            />
          )
          : null}

        {!hiddenSidebarGroups.includes("customization") && visibleCustomizationItems.length > 0
          ? (
            <SidebarNavSection
              sectionKey="customization"
              label="Customization"
              items={visibleCustomizationItems}
            />
          )
          : null}
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
      <SidebarResizeHandle />
      <SidebarRail />
    </Sidebar>
  );
}
