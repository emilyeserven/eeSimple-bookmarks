import type { PinnedSidebarEntityType, PinnedSidebarItem } from "@eesimple/types";

import * as React from "react";

import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Bookmark,
  ChevronDown,
  Clapperboard,
  Filter,
  FolderOpen,
  Globe,
  Home,
  Layers,
  MonitorPlay,
  Palette,
  Server,
  Share2,
  SlidersHorizontal,
  Tags,
  Wand2,
} from "lucide-react";

import { CollapsibleSection, SidebarNavSection, SidebarResizeHandle } from "./app-sidebar-sections";
import { useViewPanelClick } from "./panel/useEditPanelClick";
import { SettingsFavoritesFlyout } from "./SettingsFavoritesFlyout";
import { useAutofillRules } from "../hooks/useAutofill";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { usePinnedSidebarItems } from "../hooks/usePinnedSidebarItems";
import { usePropertyGroups } from "../hooks/usePropertyGroups";
import { useSavedFilters } from "../hooks/useSavedFilters";
import { useTags } from "../hooks/useTags";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";
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
    key: "relationship-types",
    title: "Relationship Types",
    to: "/taxonomies/relationship-types",
    icon: Share2,
  },
  {
    key: "autofill",
    title: "Autofill Rules",
    to: "/autofill",
    icon: Wand2,
  },
] as const;

interface ResolvedPin {
  id: string;
  label: string;
  icon: React.ReactNode;
  link: {
    kind: "path";
    path: string;
  } | {
    kind: "filter";
    search: ReturnType<typeof validateBookmarkSearch>;
  };
  bookmarkCount?: number;
  isActive: boolean;
}

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
  const {
    data: pinnedItems = [],
  } = usePinnedSidebarItems();
  const {
    data: savedFilters,
  } = useSavedFilters();
  const [pinnedExpanded, setPinnedExpanded] = React.useState(false);
  const [pinnedShowAll, setPinnedShowAll] = React.useState(false);
  const hiddenCategoryIds = useUiStore(s => s.hiddenCategoryIds);
  const hiddenTaxonomyItems = useUiStore(s => s.hiddenTaxonomyItems);
  const hiddenCustomizationItems = useUiStore(s => s.hiddenCustomizationItems);
  const hiddenSidebarGroups = useUiStore(s => s.hiddenSidebarGroups);
  const modifier = useUiStore(s => s.sidebarOpenModifier);
  const coolifyLinkEnabled = useUiStore(s => s.coolifyLinkEnabled);
  const coolifyUrl = useUiStore(s => s.coolifyUrl);
  const docsLinkEnabled = useUiStore(s => s.docsLinkEnabled);
  const storybookLinkEnabled = useUiStore(s => s.storybookLinkEnabled);
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

  const resolvedPins = React.useMemo((): ResolvedPin[] => {
    return pinnedItems.flatMap((pin: PinnedSidebarItem): ResolvedPin[] => {
      switch (pin.entityType as PinnedSidebarEntityType) {
        case "category": {
          const e = (categories ?? []).find(c => c.id === pin.entityId);
          if (!e) return [];
          return [{
            id: pin.id,
            label: e.name,
            icon: <CategoryIcon name={e.icon} />,
            link: {
              kind: "path",
              path: `/categories/${e.slug}`,
            },
            bookmarkCount: e.bookmarkCount,
            isActive: pathname === `/categories/${e.slug}`,
          }];
        }
        case "tag": {
          const e = (allTags ?? []).find(t => t.id === pin.entityId);
          if (!e) return [];
          return [{
            id: pin.id,
            label: e.name,
            icon: <Tags />,
            link: {
              kind: "path",
              path: `/tags/${e.slug}`,
            },
            bookmarkCount: e.bookmarkCount,
            isActive: pathname === `/tags/${e.slug}`,
          }];
        }
        case "website": {
          const e = (allWebsites ?? []).find(w => w.id === pin.entityId);
          if (!e) return [];
          return [{
            id: pin.id,
            label: e.siteName,
            icon: <Globe />,
            link: {
              kind: "path",
              path: `/taxonomies/websites/${e.slug}`,
            },
            bookmarkCount: e.bookmarkCount,
            isActive: pathname.startsWith(`/taxonomies/websites/${e.slug}`),
          }];
        }
        case "media-type": {
          const e = (allMediaTypes ?? []).find(m => m.id === pin.entityId);
          if (!e) return [];
          return [{
            id: pin.id,
            label: e.name,
            icon: <CategoryIcon name={e.icon} />,
            link: {
              kind: "path",
              path: `/taxonomies/media-types/${e.slug}`,
            },
            bookmarkCount: e.bookmarkCount,
            isActive: pathname.startsWith(`/taxonomies/media-types/${e.slug}`),
          }];
        }
        case "youtube-channel": {
          const e = (allChannels ?? []).find(c => c.id === pin.entityId);
          if (!e) return [];
          return [{
            id: pin.id,
            label: e.name,
            icon: <MonitorPlay />,
            link: {
              kind: "path",
              path: `/taxonomies/youtube-channels/${e.slug}`,
            },
            bookmarkCount: e.bookmarkCount,
            isActive: pathname.startsWith(`/taxonomies/youtube-channels/${e.slug}`),
          }];
        }
        case "saved-filter": {
          const e = (savedFilters ?? []).find(f => f.id === pin.entityId);
          if (!e) return [];
          return [{
            id: pin.id,
            label: e.name,
            icon: <Filter />,
            link: {
              kind: "filter",
              search: validateBookmarkSearch(e.filters),
            },
            isActive: pathname === "/bookmarks" || pathname === "/bookmarks/",
          }];
        }
      }
    });
  }, [pinnedItems, categories, allTags, allWebsites, allMediaTypes, allChannels, savedFilters, pathname]);

  const PINNED_INITIAL = 5;
  const PINNED_EXPANDED = 10;
  const visiblePins = pinnedShowAll
    ? resolvedPins
    : resolvedPins.slice(0, pinnedExpanded ? PINNED_EXPANDED : PINNED_INITIAL);
  const hasShowMore = !pinnedExpanded && !pinnedShowAll && resolvedPins.length > PINNED_INITIAL;
  const hasSeeAll = pinnedExpanded && !pinnedShowAll && resolvedPins.length > PINNED_EXPANDED;

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
              {resolvedPins.length > 0
                ? (
                  <>
                    {visiblePins.map((pin) => {
                      return (
                        <SidebarMenuItem key={pin.id}>
                          <SidebarMenuButton
                            asChild
                            isActive={pin.isActive}
                            tooltip={pin.label}
                          >
                            {pin.link.kind === "path"
                              ? (
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                <Link to={pin.link.path as any}>
                                  {pin.icon}
                                  <span>{pin.label}</span>
                                </Link>
                              )
                              : (
                                <Link
                                  to="/bookmarks"
                                  search={pin.link.search}
                                >
                                  {pin.icon}
                                  <span>{pin.label}</span>
                                </Link>
                              )}
                          </SidebarMenuButton>
                          {pin.bookmarkCount != null && state !== "collapsed"
                            ? (
                              <SidebarMenuBadge>
                                <Badge variant="secondary">{pin.bookmarkCount}</Badge>
                              </SidebarMenuBadge>
                            )
                            : null}
                        </SidebarMenuItem>
                      );
                    })}
                    {hasShowMore && state !== "collapsed"
                      ? (
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            tooltip="Show more pinned items"
                            onClick={() => setPinnedExpanded(true)}
                            className="text-xs text-muted-foreground"
                          >
                            <ChevronDown className="size-4" />
                            <span>Show More</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                      : null}
                    {hasSeeAll && state !== "collapsed"
                      ? (
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            tooltip="Show all pinned items"
                            onClick={() => setPinnedShowAll(true)}
                            className="text-xs text-muted-foreground"
                          >
                            <ChevronDown className="size-4" />
                            <span>See All</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                      : null}
                  </>
                )
                : null}
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
        {(coolifyLinkEnabled && coolifyUrl.trim() !== "") || docsLinkEnabled || storybookLinkEnabled
          ? (
            <SidebarMenu>
              {coolifyLinkEnabled && coolifyUrl.trim() !== ""
                ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Coolify"
                    >
                      <a
                        href={coolifyUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Server />
                        <span>Coolify</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
                : null}
              {docsLinkEnabled
                ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Docs"
                    >
                      <a
                        href="/docs"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <BookOpen />
                        <span>Docs</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
                : null}
              {storybookLinkEnabled
                ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Storybook"
                    >
                      <a
                        href="/storybook"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Palette />
                        <span>Storybook</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
                : null}
            </SidebarMenu>
          )
          : null}
        <SettingsFavoritesFlyout pathname={pathname} />
      </SidebarFooter>
      <SidebarResizeHandle />
      <SidebarRail />
    </Sidebar>
  );
}
