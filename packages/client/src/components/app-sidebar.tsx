import * as React from "react";

import { Link } from "@tanstack/react-router";
import {
  Bookmark,
  Building2,
  ChevronDown,
  ChevronUp,
  Clapperboard,
  FileInput,
  FolderOpen,
  Globe,
  Home,
  Inbox,
  Layers,
  LayoutGrid,
  ListFilter,
  Mail,
  MapPin,
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
    key: "locations",
    title: "Locations",
    to: "/taxonomies/locations",
    icon: MapPin,
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
    icon: FileInput,
  },
  {
    key: "saved-filters",
    title: "Saved Filters",
    to: "/saved-filters",
    icon: ListFilter,
  },
] as const;

// ─── Shared sub-components ────────────────────────────────────────────────────

/** Renders a sidebar count badge when count is non-null and the sidebar is not icon-collapsed. */
function SidebarCountBadge({
  count,
  sidebarState,
  minCount = 0,
}: {
  count: number | null | undefined;
  sidebarState: string;
  minCount?: number;
}) {
  if (count == null || sidebarState === "collapsed" || count < minCount) return null;
  return (
    <SidebarMenuBadge>
      <Badge variant="secondary">{count}</Badge>
    </SidebarMenuBadge>
  );
}

interface LinkSidebarItem {
  key: string;
  title: string;
  to: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  count?: number;
}

/**
 * Collapsible sidebar section with a visible set of nav links and an optional
 * "See More" expand affordance for items hidden behind the fold.
 */
function ExpandableLinkSection({
  sectionKey,
  label,
  visibleItems,
  seeMoreItems,
  expanded,
  setExpanded,
  pathname,
  sidebarState,
  seeMoreTooltip,
}: {
  sectionKey: string;
  label: string;
  visibleItems: LinkSidebarItem[];
  seeMoreItems: LinkSidebarItem[];
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  pathname: string;
  sidebarState: string;
  seeMoreTooltip: string;
}) {
  const renderItem = (item: LinkSidebarItem) => {
    const isActive = pathname.startsWith(item.to);
    return (
      <SidebarMenuItem key={item.key}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={item.title}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Link to={item.to as any}>
            <item.icon />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
        <SidebarCountBadge
          count={item.count}
          sidebarState={sidebarState}
        />
      </SidebarMenuItem>
    );
  };

  return (
    <CollapsibleSection
      sectionKey={sectionKey}
      label={label}
    >
      <SidebarMenu>
        {visibleItems.map(renderItem)}
        {seeMoreItems.length > 0 && !expanded && sidebarState !== "collapsed" && (
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={seeMoreTooltip}
              onClick={() => setExpanded(true)}
              className="text-xs text-muted-foreground"
            >
              <ChevronDown className="size-4" />
              <span>See More</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        {expanded && seeMoreItems.map(renderItem)}
        {seeMoreItems.length > 0 && expanded && sidebarState !== "collapsed" && (
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="See less"
              onClick={() => setExpanded(false)}
              className="text-xs text-muted-foreground"
            >
              <ChevronUp className="size-4" />
              <span>See Less</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </CollapsibleSection>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const {
    state,
    isMobile,
    setOpenMobile,
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
    aiSummarizationCount,
    modifier,
    viewClick,
    hiddenSidebarGroups,
    advanced,
  } = useAppSidebarData(taxonomyItems, customizationItems);
  const {
    visiblePins, hasShowMore, hasSeeAll, hasShowLess,
  } = pagination;

  // On mobile the sidebar is an overlay sheet; collapse it once navigation lands
  // on a new route so the tapped destination isn't hidden behind it.
  React.useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

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
                    {item.to === "/inbox"
                      ? (
                        <SidebarCountBadge
                          count={inboxCount}
                          sidebarState={state}
                        />
                      )
                      : null}
                    {item.to === "/bookmarks"
                      ? (
                        <SidebarCountBadge
                          count={allBookmarks?.length}
                          sidebarState={state}
                        />
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
                          <SidebarCountBadge
                            count={pin.bookmarkCount}
                            sidebarState={state}
                          />
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
                    {hasShowLess && state !== "collapsed"
                      ? (
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            tooltip="Show fewer pinned items"
                            onClick={() => {
                              setPinnedExpanded(false);
                              setPinnedShowAll(false);
                            }}
                            className="text-xs text-muted-foreground"
                          >
                            <ChevronUp className="size-4" />
                            <span>Show Less</span>
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
                    <SidebarCountBadge
                      count={filter.bookmarkCount}
                      sidebarState={state}
                    />
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
                      <SidebarCountBadge
                        count={category.bookmarkCount}
                        sidebarState={state}
                      />
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
                        <SidebarCountBadge
                          count={category.bookmarkCount}
                          sidebarState={state}
                        />
                      </SidebarMenuItem>
                    );
                  })
                  : null}
                {seeMoreCategories.length > 0 && categoriesExpanded && state !== "collapsed"
                  ? (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip="Show fewer categories"
                        onClick={() => setCategoriesExpanded(false)}
                        className="text-xs text-muted-foreground"
                      >
                        <ChevronUp className="size-4" />
                        <span>See Less</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                  : null}
              </SidebarMenu>
            </CollapsibleSection>
          )
          : null}

        {!hiddenSidebarGroups.includes("taxonomies") && (visibleTaxonomyItems.length > 0 || seeMoreTaxonomyItemsList.length > 0)
          ? (
            <ExpandableLinkSection
              sectionKey="taxonomies"
              label="Taxonomies"
              visibleItems={visibleTaxonomyItems}
              seeMoreItems={seeMoreTaxonomyItemsList}
              expanded={taxonomiesExpanded}
              setExpanded={setTaxonomiesExpanded}
              pathname={pathname}
              sidebarState={state}
              seeMoreTooltip="Show more taxonomy links"
            />
          )
          : null}

        {!hiddenSidebarGroups.includes("customization") && (visibleCustomizationItems.length > 0 || seeMoreCustomizationItemsList.length > 0)
          ? (
            <ExpandableLinkSection
              sectionKey="customization"
              label="Customization"
              visibleItems={visibleCustomizationItems}
              seeMoreItems={seeMoreCustomizationItemsList}
              expanded={customizationExpanded}
              setExpanded={setCustomizationExpanded}
              pathname={pathname}
              sidebarState={state}
              seeMoreTooltip="Show more customization links"
            />
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
                  const count = item.to === "/ai-summarization" ? aiSummarizationCount : undefined;
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
                      <SidebarCountBadge
                        count={count}
                        sidebarState={state}
                        minCount={1}
                      />
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
