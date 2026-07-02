import * as React from "react";

import { Link } from "@tanstack/react-router";
import { Bookmark, ChevronDown, ChevronUp } from "lucide-react";

import {
  CollapsibleSection,
  SidebarAdvancedSection,
  SidebarResizeHandle,
} from "./app-sidebar-sections";
import { LocationsSidebarItem } from "./LocationsSidebarItem";
import { SettingsFavoritesFlyout } from "./SettingsFavoritesFlyout";
import { SidebarCategoriesSection } from "./SidebarCategoriesSection";
import { SidebarCountBadge } from "./SidebarCountBadge";
import { SidebarPrimaryNav } from "./SidebarPrimaryNav";
import { SidebarSavedFiltersSection } from "./SidebarSavedFiltersSection";
import { useAppSidebarData } from "./useAppSidebarData";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  actionItems,
  customizationItems,
  taxonomyItems,
} from "@/lib/sidebarNavItems";

// ─── Shared sub-components ────────────────────────────────────────────────────

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
  placeTypesCount,
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
  placeTypesCount?: number;
}) {
  const renderItem = (item: LinkSidebarItem) => {
    // Locations gets a hover flyout surfacing its Place Types taxonomy; every other item is a plain link.
    if (item.key === "locations") {
      return (
        <LocationsSidebarItem
          key={item.key}
          pathname={pathname}
          locationsCount={item.count}
          placeTypesCount={placeTypesCount}
          sidebarState={sidebarState}
        />
      );
    }
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
    placeTypesCount,
    modifier,
    viewClick,
    hiddenSidebarGroups,
    advanced,
  } = useAppSidebarData(taxonomyItems, customizationItems);

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
        <SidebarPrimaryNav
          pathname={pathname}
          sidebarState={state}
          inboxCount={inboxCount}
          bookmarkCount={allBookmarks?.length}
          resolvedPins={resolvedPins}
          pagination={pagination}
          setPinnedExpanded={setPinnedExpanded}
          setPinnedShowAll={setPinnedShowAll}
        />

        {viewableFilters.length > 0
          ? (
            <SidebarSavedFiltersSection
              viewableFilters={viewableFilters}
              sidebarState={state}
            />
          )
          : null}

        {!hiddenSidebarGroups.includes("categories") && (visibleCategories.length > 0 || seeMoreCategories.length > 0)
          ? (
            <SidebarCategoriesSection
              visibleCategories={visibleCategories}
              seeMoreCategories={seeMoreCategories}
              expanded={categoriesExpanded}
              setExpanded={setCategoriesExpanded}
              pathname={pathname}
              modifier={modifier}
              sidebarState={state}
              onViewClick={(event, id) => viewClick(event, "category", id)}
            />
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
              placeTypesCount={placeTypesCount}
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
