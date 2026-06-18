import * as React from "react";

import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bookmark,
  ChevronDown,
  Clapperboard,
  FolderOpen,
  Globe,
  Home,
  MonitorPlay,
  Settings,
  SlidersHorizontal,
  Tags,
  Wand2,
} from "lucide-react";

import { useCategories } from "../hooks/useCategories";
import { useResizeHandle } from "../hooks/useResizeHandle";
import { useUiStore } from "../stores/uiStore";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  useSidebar,
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
    key: "autofill",
    title: "Autofill Rules",
    to: "/autofill",
    icon: Wand2,
  },
] as const;

const managementItems = [
  {
    key: "categories",
    title: "Categories",
    to: "/settings/categories",
    icon: FolderOpen,
  },
  {
    key: "tags",
    title: "Tags",
    to: "/settings/tags",
    icon: Tags,
  },
] as const;

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });
  const {
    state: sidebarState,
  } = useSidebar();
  const {
    data: categories,
  } = useCategories();
  const hiddenCategoryIds = useUiStore(state => state.hiddenCategoryIds);
  const hiddenTaxonomyItems = useUiStore(state => state.hiddenTaxonomyItems);
  const hiddenCustomizationItems = useUiStore(state => state.hiddenCustomizationItems);
  const hiddenManagementItems = useUiStore(state => state.hiddenManagementItems);
  const collapsedSidebarSections = useUiStore(state => state.collapsedSidebarSections);
  const toggleSidebarSection = useUiStore(state => state.toggleSidebarSection);

  const isIconMode = sidebarState === "collapsed";

  function CollapsibleSection({
    sectionKey,
    label,
    children,
  }: {
    sectionKey: string;
    label: string;
    children: React.ReactNode;
  }) {
    const isCollapsed = collapsedSidebarSections.includes(sectionKey);
    if (isIconMode) {
      return (
        <SidebarGroup>
          <SidebarGroupLabel>{label}</SidebarGroupLabel>
          <SidebarGroupContent>{children}</SidebarGroupContent>
        </SidebarGroup>
      );
    }
    return (
      <Collapsible
        open={!isCollapsed}
        onOpenChange={() => toggleSidebarSection(sectionKey)}
      >
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <CollapsibleTrigger
              className="flex w-full items-center justify-between"
            >
              {label}
              <ChevronDown
                className={`
                  size-3.5 shrink-0 transition-transform duration-200
                  ${isCollapsed ? "-rotate-90" : ""}
                `}
              />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>{children}</SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  }

  const visibleCategories = (categories ?? []).filter(
    c => !hiddenCategoryIds.includes(c.id),
  );
  const visibleTaxonomyItems = taxonomyItems.filter(
    item => !hiddenTaxonomyItems.includes(item.key),
  );
  const visibleCustomizationItems = customizationItems.filter(
    item => !hiddenCustomizationItems.includes(item.key),
  );
  const visibleManagementItems = managementItems.filter(
    item => !hiddenManagementItems.includes(item.key),
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

        {visibleCategories.length > 0
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

        {visibleTaxonomyItems.length > 0
          ? (
            <CollapsibleSection
              sectionKey="taxonomies"
              label="Taxonomies"
            >
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
            </CollapsibleSection>
          )
          : null}

        {visibleCustomizationItems.length > 0
          ? (
            <CollapsibleSection
              sectionKey="customization"
              label="Customization"
            >
              <SidebarMenu>
                {visibleCustomizationItems.map((item) => {
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
            </CollapsibleSection>
          )
          : null}

        {visibleManagementItems.length > 0
          ? (
            <CollapsibleSection
              sectionKey="management"
              label="Management"
            >
              <SidebarMenu>
                {visibleManagementItems.map((item) => {
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
            </CollapsibleSection>
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

function SidebarResizeHandle() {
  const {
    state,
  } = useSidebar();
  const sidebarWidth = useUiStore(s => s.sidebarWidth);
  const setSidebarWidth = useUiStore(s => s.setSidebarWidth);
  const {
    onPointerDown,
  } = useResizeHandle({
    direction: "right",
    currentWidth: sidebarWidth,
    onChange: setSidebarWidth,
    min: 10,
    max: 28,
  });

  if (state === "collapsed") return null;

  return (
    <div
      className="
        absolute inset-y-0 -right-0.5 z-30 w-1 cursor-col-resize
        transition-colors
        hover:bg-sidebar-border/60
      "
      onPointerDown={onPointerDown}
    />
  );
}
