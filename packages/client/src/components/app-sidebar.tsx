import type { SidebarFlyoutData } from "./useSidebarFlyoutConfigs";

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
import { SettingsFavoritesFlyout } from "./SettingsFavoritesFlyout";
import { SidebarCountBadge } from "./SidebarCountBadge";
import { SidebarPrimaryNav } from "./SidebarPrimaryNav";
import { SidebarSavedFiltersSection } from "./SidebarSavedFiltersSection";
import { SidebarScratchpad } from "./SidebarScratchpad";
import { SidebarTabBasket } from "./SidebarTabBasket";
import { StarredFlyoutSidebarItem } from "./StarredFlyoutSidebarItem";
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
  flyoutConfigs,
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
  flyoutConfigs: SidebarFlyoutData;
}) {
  const {
    t,
  } = useTranslation();
  // Every item renders through the generic flyout component: its per-key config supplies the fixed
  // shortcut links and/or starred members; with neither, it degrades to a plain link. Starred members
  // link to `${item.to}/${slug}` (the entity's detail page).
  const renderItem = (item: LinkSidebarItem) => {
    const flyout = flyoutConfigs[item.key];
    return (
      <StarredFlyoutSidebarItem
        key={item.key}
        pathname={pathname}
        sidebarState={sidebarState}
        config={{
          rootTo: item.to,
          triggerIcon: <item.icon />,
          label: t(item.title),
          count: item.count,
          starredTitle: flyout?.starredTitle ?? t("Starred"),
          shortcuts: flyout?.shortcuts,
          starred: flyout?.starred?.map(entry => ({
            id: entry.id,
            label: entry.name,
            icon: entry.icon,
            to: `${item.to}/${entry.slug}`,
            count: entry.count,
          })),
        }}
      />
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
    flyoutConfigs,
    visibleTaxonomyItems,
    seeMoreTaxonomyItemsList,
    taxonomiesExpanded,
    setTaxonomiesExpanded,
    visibleCustomizationItems,
    seeMoreCustomizationItemsList,
    customizationExpanded,
    setCustomizationExpanded,
    resolvedPins,
    pinnedSectionGroups,
    viewableFilters,
    setPinnedExpanded,
    setPinnedShowAll,
    pagination,
    allBookmarks,
    inboxCount,
    aiSummarizationCount,
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
          pinnedSectionGroups={pinnedSectionGroups}
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
              flyoutConfigs={flyoutConfigs}
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
              flyoutConfigs={flyoutConfigs}
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
