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

import { CollapsibleSection, SidebarNavSection, SidebarResizeHandle } from "./app-sidebar-sections";
import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useAutofillRules } from "../hooks/useAutofill";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { usePropertyGroups } from "../hooks/usePropertyGroups";
import { useTags } from "../hooks/useTags";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { useUiStore } from "../stores/uiStore";

import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
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
    to: "/autofill/",
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
    state,
  } = useSidebar();
  const {
    data: allBookmarks,
  } = useBookmarks();
  const {
    data: categories,
  } = useCategories();
  const {
    data: allTags,
  } = useTags();
  const {
    data: allWebsites,
  } = useWebsites();
  const {
    data: allMediaTypes,
  } = useMediaTypes();
  const {
    data: allChannels,
  } = useYouTubeChannels();
  const {
    data: allCustomProperties,
  } = useCustomProperties();
  const {
    data: allPropertyGroups,
  } = usePropertyGroups();
  const {
    data: allAutofillRules,
  } = useAutofillRules();
  const hiddenCategoryIds = useUiStore(s => s.hiddenCategoryIds);
  const hiddenTaxonomyItems = useUiStore(s => s.hiddenTaxonomyItems);
  const hiddenCustomizationItems = useUiStore(s => s.hiddenCustomizationItems);
  const hiddenSidebarGroups = useUiStore(s => s.hiddenSidebarGroups);
  const modifier = useUiStore(s => s.sidebarOpenModifier);
  const viewClick = useViewPanelClick();

  const visibleCategories = (categories ?? []).filter(
    c => !hiddenCategoryIds.includes(c.id),
  );

  const taxonomyCountByKey: Record<string, number | undefined> = {
    "categories": categories?.length,
    "tags": allTags?.length,
    "websites": allWebsites?.length,
    "media-types": allMediaTypes?.length,
    "youtube-channels": allChannels?.length,
  };
  const visibleTaxonomyItems = taxonomyItems
    .filter(item => !hiddenTaxonomyItems.includes(item.key))
    .map(item => ({
      ...item,
      count: taxonomyCountByKey[item.key],
    }));

  const customizationCountByKey: Record<string, number | undefined> = {
    "custom-properties": allCustomProperties?.length,
    "property-groups": allPropertyGroups?.length,
    "autofill": allAutofillRules?.length,
  };
  const visibleCustomizationItems = customizationItems
    .filter(item => !hiddenCustomizationItems.includes(item.key))
    .map(item => ({
      ...item,
      count: customizationCountByKey[item.key],
    }));

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
                    {item.to === "/bookmarks" && allBookmarks != null && state !== "collapsed"
                      ? (
                        <SidebarMenuBadge>
                          <Badge variant="secondary">{allBookmarks.length}</Badge>
                        </SidebarMenuBadge>
                      )
                      : null}
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
                      {category.bookmarkCount != null && state !== "collapsed"
                        ? (
                          <SidebarMenuBadge>
                            <Badge variant="secondary">{category.bookmarkCount}</Badge>
                          </SidebarMenuBadge>
                        )
                        : null}
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
