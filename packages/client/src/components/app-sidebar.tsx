import * as React from "react";

import { Link } from "@tanstack/react-router";
import {
  Bookmark,
  Building2,
  ChevronDown,
  Clapperboard,
  Filter,
  FolderOpen,
  Globe,
  Home,
  Inbox,
  Layers,
  LayoutGrid,
  ListFilter,
  Mail,
  MonitorPlay,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Tags,
  UserRound,
  Wand2,
} from "lucide-react";

import {
  CollapsibleSection,
  SidebarAdvancedSection,
  SidebarResizeHandle,
} from "./app-sidebar-sections";
import { SettingsFavoritesFlyout } from "./SettingsFavoritesFlyout";
import { useAppSidebarData } from "./useAppSidebarData";

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
    title: "Inbox",
    to: "/inbox",
    icon: Inbox,
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
  {
    key: "newsletters",
    title: "Imports",
    to: "/taxonomies/newsletters",
    icon: Mail,
  },
  {
    key: "authors",
    title: "Authors",
    to: "/taxonomies/authors",
    icon: UserRound,
  },
  {
    key: "publishers",
    title: "Publishers",
    to: "/taxonomies/publishers",
    icon: Building2,
  },
] as const;

const actionItems = [
  {
    title: "AI Summarization",
    to: "/ai-summarization",
    icon: Sparkles,
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
  {
    key: "card-display-rules",
    title: "Card Display Rules",
    to: "/card-display-rules",
    icon: LayoutGrid,
  },
  {
    key: "import-rules",
    title: "Import Rules",
    to: "/import-rules",
    icon: Filter,
  },
  {
    key: "saved-filters",
    title: "Saved Filters",
    to: "/saved-filters",
    icon: ListFilter,
  },
] as const;

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const {
    state,
  } = useSidebar();
  const {
    pathname,
    visibleCategories,
    seeMoreCategories,
    categoriesExpanded,
    setCategoriesExpanded,
    visibleTaxonomyItems,
    seeMoreTaxonomyItemsList,
    taxonomiesExpanded,
    setTaxonomiesExpanded,
    visibleCustomizationItems,
    seeMoreCustomizationItemsList,
    customizationExpanded,
    setCustomizationExpanded,
    resolvedPins,
    viewableFilters,
    setPinnedExpanded,
    setPinnedShowAll,
    pagination,
    allBookmarks,
    inboxCount,
    modifier,
    viewClick,
    hiddenSidebarGroups,
    advanced,
  } = useAppSidebarData(taxonomyItems, customizationItems);
  const {
    visiblePins, hasShowMore, hasSeeAll,
  } = pagination;

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
                    {item.to === "/inbox" && inboxCount != null && state !== "collapsed"
                      ? (
                        <SidebarMenuBadge>
                          <Badge variant="secondary">{inboxCount}</Badge>
                        </SidebarMenuBadge>
                      )
                      : null}
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

        {viewableFilters.length > 0
          ? (
            <CollapsibleSection
              sectionKey="saved-filters"
              label="Saved Filters"
            >
              <SidebarMenu>
                {viewableFilters.map(filter => (
                  <SidebarMenuItem key={filter.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={filter.isActive}
                      tooltip={filter.label}
                    >
                      <Link
                        to="/bookmarks"
                        search={filter.link.kind === "filter" ? filter.link.search : undefined}
                      >
                        {filter.icon}
                        <span>{filter.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {filter.bookmarkCount != null && state !== "collapsed"
                      ? (
                        <SidebarMenuBadge>
                          <Badge variant="secondary">{filter.bookmarkCount}</Badge>
                        </SidebarMenuBadge>
                      )
                      : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </CollapsibleSection>
          )
          : null}

        {!hiddenSidebarGroups.includes("categories") && (visibleCategories.length > 0 || seeMoreCategories.length > 0)
          ? (
            <CollapsibleSection
              sectionKey="categories"
              label="Categories"
            >
              <SidebarMenu>
                {visibleCategories.map((category) => {
                  const isActive = pathname.startsWith(`/categories/${category.slug}`);
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
                {seeMoreCategories.length > 0 && !categoriesExpanded && state !== "collapsed"
                  ? (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip="Show more categories"
                        onClick={() => setCategoriesExpanded(true)}
                        className="text-xs text-muted-foreground"
                      >
                        <ChevronDown className="size-4" />
                        <span>See More</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                  : null}
                {categoriesExpanded
                  ? seeMoreCategories.map((category) => {
                    const isActive = pathname.startsWith(`/categories/${category.slug}`);
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
                  })
                  : null}
              </SidebarMenu>
            </CollapsibleSection>
          )
          : null}

        {!hiddenSidebarGroups.includes("taxonomies") && (visibleTaxonomyItems.length > 0 || seeMoreTaxonomyItemsList.length > 0)
          ? (
            <CollapsibleSection
              sectionKey="taxonomies"
              label="Taxonomies"
            >
              <SidebarMenu>
                {visibleTaxonomyItems.map((item) => {
                  const isActive = pathname.startsWith(item.to);
                  return (
                    <SidebarMenuItem key={item.key}>
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
                      {item.count !== undefined && state !== "collapsed"
                        ? (
                          <SidebarMenuBadge>
                            <Badge variant="secondary">{item.count}</Badge>
                          </SidebarMenuBadge>
                        )
                        : null}
                    </SidebarMenuItem>
                  );
                })}
                {seeMoreTaxonomyItemsList.length > 0 && !taxonomiesExpanded && state !== "collapsed"
                  ? (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip="Show more taxonomy links"
                        onClick={() => setTaxonomiesExpanded(true)}
                        className="text-xs text-muted-foreground"
                      >
                        <ChevronDown className="size-4" />
                        <span>See More</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                  : null}
                {taxonomiesExpanded
                  ? seeMoreTaxonomyItemsList.map((item) => {
                    const isActive = pathname.startsWith(item.to);
                    return (
                      <SidebarMenuItem key={item.key}>
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
                        {item.count !== undefined && state !== "collapsed"
                          ? (
                            <SidebarMenuBadge>
                              <Badge variant="secondary">{item.count}</Badge>
                            </SidebarMenuBadge>
                          )
                          : null}
                      </SidebarMenuItem>
                    );
                  })
                  : null}
              </SidebarMenu>
            </CollapsibleSection>
          )
          : null}

        {!hiddenSidebarGroups.includes("customization") && (visibleCustomizationItems.length > 0 || seeMoreCustomizationItemsList.length > 0)
          ? (
            <CollapsibleSection
              sectionKey="customization"
              label="Customization"
            >
              <SidebarMenu>
                {visibleCustomizationItems.map((item) => {
                  const isActive = pathname.startsWith(item.to);
                  return (
                    <SidebarMenuItem key={item.key}>
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
                      {item.count !== undefined && state !== "collapsed"
                        ? (
                          <SidebarMenuBadge>
                            <Badge variant="secondary">{item.count}</Badge>
                          </SidebarMenuBadge>
                        )
                        : null}
                    </SidebarMenuItem>
                  );
                })}
                {seeMoreCustomizationItemsList.length > 0 && !customizationExpanded && state !== "collapsed"
                  ? (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip="Show more customization links"
                        onClick={() => setCustomizationExpanded(true)}
                        className="text-xs text-muted-foreground"
                      >
                        <ChevronDown className="size-4" />
                        <span>See More</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                  : null}
                {customizationExpanded
                  ? seeMoreCustomizationItemsList.map((item) => {
                    const isActive = pathname.startsWith(item.to);
                    return (
                      <SidebarMenuItem key={item.key}>
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
                        {item.count !== undefined && state !== "collapsed"
                          ? (
                            <SidebarMenuBadge>
                              <Badge variant="secondary">{item.count}</Badge>
                            </SidebarMenuBadge>
                          )
                          : null}
                      </SidebarMenuItem>
                    );
                  })
                  : null}
              </SidebarMenu>
            </CollapsibleSection>
          )
          : null}

        {!hiddenSidebarGroups.includes("action")
          ? (
            <CollapsibleSection
              sectionKey="action"
              label="Action"
            >
              <SidebarMenu>
                {actionItems.map((item) => {
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

        <SidebarAdvancedSection advanced={advanced} />
      </SidebarContent>
      <SidebarFooter>
        <SettingsFavoritesFlyout pathname={pathname} />
      </SidebarFooter>
      <SidebarResizeHandle />
      <SidebarRail />
    </Sidebar>
  );
}
