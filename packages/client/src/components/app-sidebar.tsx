import * as React from "react";

import { GENRES_MOODS_TAXONOMY_SLUG } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { Bookmark, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  CollapsibleSection,
  SidebarAdvancedSection,
  SidebarConnectorsSection,
  SidebarResizeHandle,
} from "./app-sidebar-sections";
import { GroupsSidebarItem } from "./GroupsSidebarItem";
import { LanguagesSidebarItem } from "./LanguagesSidebarItem";
import { LocationsSidebarItem } from "./LocationsSidebarItem";
import { SettingsFavoritesFlyout } from "./SettingsFavoritesFlyout";
import { SidebarCategoriesSection } from "./SidebarCategoriesSection";
import { SidebarCountBadge } from "./SidebarCountBadge";
import { SidebarPrimaryNav } from "./SidebarPrimaryNav";
import { SidebarSavedFiltersSection } from "./SidebarSavedFiltersSection";
import { SidebarScratchpad } from "./SidebarScratchpad";
import { SidebarTabBasket } from "./SidebarTabBasket";
import { useAppSidebarData } from "./useAppSidebarData";
import { useTaxonomies } from "../hooks/useTaxonomies";

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
import { CategoryIcon } from "@/lib/icons";
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
  locationRelationsCount,
  groupTypesCount,
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
  locationRelationsCount?: number;
  groupTypesCount?: number;
}) {
  const {
    t,
  } = useTranslation();
  const renderItem = (item: LinkSidebarItem) => {
    // Locations gets a hover flyout surfacing its Place Types taxonomy; every other item is a plain link.
    if (item.key === "locations") {
      return (
        <LocationsSidebarItem
          key={item.key}
          pathname={pathname}
          locationsCount={item.count}
          placeTypesCount={placeTypesCount}
          locationRelationsCount={locationRelationsCount}
          sidebarState={sidebarState}
        />
      );
    }
    // Groups gets a hover flyout surfacing its Group Types taxonomy.
    if (item.key === "groups") {
      return (
        <GroupsSidebarItem
          key={item.key}
          pathname={pathname}
          groupsCount={item.count}
          groupTypesCount={groupTypesCount}
          sidebarState={sidebarState}
        />
      );
    }
    // Languages gets a hover flyout surfacing its Usage Levels taxonomy.
    if (item.key === "languages") {
      return (
        <LanguagesSidebarItem
          key={item.key}
          pathname={pathname}
          languagesCount={item.count}
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
          tooltip={t(item.title)}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Link to={item.to as any}>
            <item.icon />
            <span>{t(item.title)}</span>
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
              <span>{t("See More")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        {expanded && seeMoreItems.map(renderItem)}
        {seeMoreItems.length > 0 && expanded && sidebarState !== "collapsed" && (
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("See less")}
              onClick={() => setExpanded(false)}
              className="text-xs text-muted-foreground"
            >
              <ChevronUp className="size-4" />
              <span>{t("See Less")}</span>
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
    t,
  } = useTranslation();
  const {
    state,
    isMobile,
    setOpenMobile,
  } = useSidebar();
  const {
    data: taxonomies,
  } = useTaxonomies();
  const customTaxonomyItems = React.useMemo(
    () => (taxonomies ?? [])
      .filter(taxonomy =>
        taxonomy.showInSidebar && !taxonomy.hidden && taxonomy.slug !== GENRES_MOODS_TAXONOMY_SLUG)
      .map(taxonomy => ({
        key: `taxonomy:${taxonomy.id}`,
        title: taxonomy.name,
        to: `/taxonomies/${taxonomy.slug}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        icon: (props: any) => (
          <CategoryIcon
            name={taxonomy.icon}
            {...props}
          />
        ),
      })),
    [taxonomies],
  );
  const mergedTaxonomyItems = React.useMemo(
    () => [...taxonomyItems, ...customTaxonomyItems],
    [customTaxonomyItems],
  );
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
    locationRelationsCount,
    groupTypesCount,
    hiddenSidebarGroups,
    advanced,
  } = useAppSidebarData(mergedTaxonomyItems, customizationItems);

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
              sidebarState={state}
            />
          )
          : null}

        {!hiddenSidebarGroups.includes("taxonomies") && (visibleTaxonomyItems.length > 0 || seeMoreTaxonomyItemsList.length > 0)
          ? (
            <ExpandableLinkSection
              sectionKey="taxonomies"
              label={t("Taxonomies")}
              visibleItems={visibleTaxonomyItems}
              seeMoreItems={seeMoreTaxonomyItemsList}
              expanded={taxonomiesExpanded}
              setExpanded={setTaxonomiesExpanded}
              pathname={pathname}
              sidebarState={state}
              seeMoreTooltip={t("Show more taxonomy links")}
              placeTypesCount={placeTypesCount}
              locationRelationsCount={locationRelationsCount}
              groupTypesCount={groupTypesCount}
            />
          )
          : null}

        {!hiddenSidebarGroups.includes("customization") && (visibleCustomizationItems.length > 0 || seeMoreCustomizationItemsList.length > 0)
          ? (
            <ExpandableLinkSection
              sectionKey="customization"
              label={t("Customization")}
              visibleItems={visibleCustomizationItems}
              seeMoreItems={seeMoreCustomizationItemsList}
              expanded={customizationExpanded}
              setExpanded={setCustomizationExpanded}
              pathname={pathname}
              sidebarState={state}
              seeMoreTooltip={t("Show more customization links")}
            />
          )
          : null}

        {!hiddenSidebarGroups.includes("action")
          ? (
            <CollapsibleSection
              sectionKey="action"
              label={t("Action")}
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
                        tooltip={t(item.title)}
                      >
                        <Link to={item.to}>
                          <item.icon />
                          <span>{t(item.title)}</span>
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

        <SidebarConnectorsSection />

        <SidebarAdvancedSection advanced={advanced} />
      </SidebarContent>
      <SidebarFooter
        className="
          border-t border-sidebar-border shadow-[0_-2px_4px_rgba(0,0,0,0.04)]
        "
      >
        <SidebarTabBasket />
        <SidebarScratchpad />
        <SettingsFavoritesFlyout pathname={pathname} />
      </SidebarFooter>
      <SidebarResizeHandle />
      <SidebarRail />
    </Sidebar>
  );
}
