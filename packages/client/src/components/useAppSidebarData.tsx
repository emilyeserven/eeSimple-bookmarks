import type { ResolvedPin } from "./useSidebarPins";
import type { Category, PinnedSection, Tag } from "@eesimple/types";

import * as React from "react";

import { useRouterState } from "@tanstack/react-router";

import { useSidebarEntityData } from "./useSidebarEntityData";
import { useResolvedPins, useViewableFilters } from "./useSidebarPins";
import {
  useAdvancedSettings,
  useSidebarVisibility,
} from "../hooks/useAppSettings";
import { useBookmarks } from "../hooks/useBookmarks";
import { usePinnedSections } from "../hooks/usePinnedSections";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

/** A pinned section paired with its resolved pins, ready to render as a labeled group. */
export interface PinnedSectionGroup {
  section: PinnedSection;
  pins: ResolvedPin[];
}

/**
 * Partition resolved pins into the ungrouped bucket (rendered first, paginated) and one group per
 * section that has at least one pin (rendered in section `sortOrder`, in full). A pin whose section
 * no longer exists falls back to ungrouped.
 */
export function groupPinsBySection(
  resolvedPins: ResolvedPin[],
  sections: PinnedSection[],
): { ungrouped: ResolvedPin[];
  groups: PinnedSectionGroup[]; } {
  const byId = new Map(sections.map(s => [s.id, s]));
  const ungrouped = resolvedPins.filter(p => p.sectionId === null || !byId.has(p.sectionId));
  const groups = [...sections]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(section => ({
      section,
      pins: resolvedPins.filter(p => p.sectionId === section.id),
    }))
    .filter(group => group.pins.length > 0);
  return {
    ungrouped,
    groups,
  };
}

export type { ResolvedPin } from "./useSidebarPins";

const PINNED_INITIAL = 5;
const PINNED_EXPANDED = 10;

/** The expand/collapse state that gates how many pins are shown. */
export interface PinPaginationState {
  pinnedExpanded: boolean;
  pinnedShowAll: boolean;
}

export interface PinPagination {
  visiblePins: ResolvedPin[];
  hasShowMore: boolean;
  hasSeeAll: boolean;
  hasShowLess: boolean;
}

/**
 * Pure pin-list pagination: how many of the resolved pins to show, and whether the "Show More" /
 * "See All" affordances apply, given the current expand state. Extracted so the sidebar data hook
 * stays under the complexity cap and this branching is unit-testable.
 */
export function paginatePins(resolvedPins: ResolvedPin[], state: PinPaginationState): PinPagination {
  const visiblePins = state.pinnedShowAll
    ? resolvedPins
    : resolvedPins.slice(0, state.pinnedExpanded ? PINNED_EXPANDED : PINNED_INITIAL);
  return {
    visiblePins,
    hasShowMore: !state.pinnedExpanded && !state.pinnedShowAll && resolvedPins.length > PINNED_INITIAL,
    hasSeeAll: state.pinnedExpanded && !state.pinnedShowAll && resolvedPins.length > PINNED_EXPANDED,
    hasShowLess: state.pinnedExpanded || state.pinnedShowAll,
  };
}

/** The Advanced-section external links resolved from app settings (each independently gated). */
export interface SidebarAdvanced {
  coolifyLinkEnabled: boolean;
  coolifyUrl: string;
  docsLinkEnabled: boolean;
  storybookLinkEnabled: boolean;
  drizzleGatewayLinkEnabled: boolean;
  drizzleGatewayUrl: string;
  githubLinkEnabled: boolean;
}

function useSidebarAdvanced(): SidebarAdvanced {
  const {
    data: advancedSettings,
  } = useAdvancedSettings();
  return {
    coolifyLinkEnabled: advancedSettings?.coolifyLinkEnabled ?? false,
    coolifyUrl: advancedSettings?.coolifyUrl ?? "",
    docsLinkEnabled: advancedSettings?.docsLinkEnabled ?? false,
    storybookLinkEnabled: advancedSettings?.storybookLinkEnabled ?? false,
    drizzleGatewayLinkEnabled: advancedSettings?.drizzleGatewayLinkEnabled ?? false,
    drizzleGatewayUrl: advancedSettings?.drizzleGatewayUrl ?? "",
    githubLinkEnabled: advancedSettings?.githubLinkEnabled ?? false,
  };
}

/** Attach each item's entity count and drop the ones the user hid. */
function withVisibleCounts<T extends { key: string }>(
  items: readonly T[],
  hiddenKeys: string[],
  countByKey: Record<string, number | undefined>,
): (T & { count: number | undefined })[] {
  return items
    .filter(item => !hiddenKeys.includes(item.key))
    .map(item => ({
      ...item,
      count: countByKey[item.key],
    }));
}

/** The minimal shape of a sidebar nav item the data hook is generic over. */
interface SidebarNavItem {
  key: string;
  title: string;
  to: string;
}

export interface AppSidebarData<T extends SidebarNavItem, C extends SidebarNavItem> {
  pathname: string;
  /** Starred categories surfaced in the Categories sidebar flyout. */
  starredCategories: Category[];
  /** Starred tags surfaced in the Tags sidebar flyout. */
  starredTags: Tag[];
  visibleTaxonomyItems: (T & { count: number | undefined })[];
  seeMoreTaxonomyItemsList: (T & { count: number | undefined })[];
  taxonomiesExpanded: boolean;
  setTaxonomiesExpanded: (v: boolean) => void;
  visibleCustomizationItems: (C & { count: number | undefined })[];
  seeMoreCustomizationItemsList: (C & { count: number | undefined })[];
  customizationExpanded: boolean;
  setCustomizationExpanded: (v: boolean) => void;
  resolvedPins: ResolvedPin[];
  /** Sections with pins, in `sortOrder`, rendered as labeled groups after the ungrouped bucket. */
  pinnedSectionGroups: PinnedSectionGroup[];
  viewableFilters: ResolvedPin[];
  pinnedExpanded: boolean;
  setPinnedExpanded: (v: boolean) => void;
  pinnedShowAll: boolean;
  setPinnedShowAll: (v: boolean) => void;
  pagination: PinPagination;
  allBookmarks: ReturnType<typeof useBookmarks>["data"];
  inboxCount: number | undefined;
  aiSummarizationCount: number | undefined;
  placeTypesCount: number | undefined;
  locationRelationsCount: number | undefined;
  groupsCount: number | undefined;
  groupTypesCount: number | undefined;
  currentBookmarkCategories: string[];
  hiddenSidebarGroups: string[];
  advanced: SidebarAdvanced;
}

/**
 * Owns the sidebar's data-fetching and derivation: every entity list, the user's visibility prefs,
 * the resolved pinned items, and the per-section visible item lists. Bundling the ~20 hooks here
 * (split into cohesive sub-hooks) keeps both this hook and the `AppSidebar` component under the
 * complexity cap.
 */
export function useAppSidebarData<T extends SidebarNavItem, C extends SidebarNavItem>(
  taxonomyItems: readonly T[],
  customizationItems: readonly C[],
): AppSidebarData<T, C> {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });
  const currentBookmarkCategories = useRouterState({
    select: state =>
      state.location.pathname.startsWith("/bookmarks")
        ? (validateBookmarkSearch(state.location.search).categories ?? [])
        : [],
  });
  const currentBookmarkSearch = useRouterState({
    select: state =>
      state.location.pathname.startsWith("/bookmarks")
        ? (state.location.search as Record<string, unknown>)
        : {},
  });
  const data = useSidebarEntityData();
  const [pinnedExpanded, setPinnedExpanded] = React.useState(false);
  const [pinnedShowAll, setPinnedShowAll] = React.useState(false);
  const {
    hiddenTaxonomyItems,
    seeMoreTaxonomyItems,
    hiddenCustomizationItems,
    seeMoreCustomizationItems,
    hiddenSidebarGroups,
  } = useSidebarVisibility();
  const advanced = useSidebarAdvanced();
  const [taxonomiesExpanded, setTaxonomiesExpanded] = React.useState(false);
  const [customizationExpanded, setCustomizationExpanded] = React.useState(false);

  const starredCategories = (data.categories ?? []).filter(c => c.isFavorite);
  const starredTags = (data.allTags ?? []).filter(t => t.isFavorite);

  const taxonomyCounts = {
    "categories": data.categories?.length,
    "tags": data.allTags?.length,
    "websites": data.allWebsites?.length,
    "media-types": data.allMediaTypes?.length,
    "locations": data.allLocations?.length,
    "youtube-channels": data.allChannels?.length,
    "newsletters": data.allNewsletters?.length,
    "people": data.allPeople?.length,
    "groups": data.allGroups?.length,
  };

  const visibleTaxonomyItems = withVisibleCounts(
    taxonomyItems,
    [...hiddenTaxonomyItems, ...seeMoreTaxonomyItems],
    taxonomyCounts,
  );

  const seeMoreTaxonomyItemsList = withVisibleCounts(
    taxonomyItems,
    hiddenTaxonomyItems,
    taxonomyCounts,
  ).filter(item => seeMoreTaxonomyItems.includes(item.key));

  const customizationCounts = {
    "custom-properties": data.allCustomProperties?.length,
    "autofill": data.allAutofillRules?.length,
  };

  const visibleCustomizationItems = withVisibleCounts(
    customizationItems,
    [...hiddenCustomizationItems, ...seeMoreCustomizationItems],
    customizationCounts,
  );

  const seeMoreCustomizationItemsList = withVisibleCounts(
    customizationItems,
    hiddenCustomizationItems,
    customizationCounts,
  ).filter(item => seeMoreCustomizationItems.includes(item.key));

  const resolvedPins = useResolvedPins(data, pathname, currentBookmarkCategories, currentBookmarkSearch);
  const {
    data: sections = [],
  } = usePinnedSections();
  const viewableFilters = useViewableFilters(data, pathname, currentBookmarkSearch);
  const {
    ungrouped: ungroupedPins, groups: pinnedSectionGroups,
  } = groupPinsBySection(resolvedPins, sections);
  // Only the ungrouped bucket paginates; user-curated named sections render in full.
  const pagination = paginatePins(ungroupedPins, {
    pinnedExpanded,
    pinnedShowAll,
  });

  return {
    pathname,
    starredCategories,
    starredTags,
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
    pinnedExpanded,
    setPinnedExpanded,
    pinnedShowAll,
    setPinnedShowAll,
    pagination,
    allBookmarks: data.allBookmarks,
    inboxCount: data.inboxItems?.filter(item => item.status === "pending").length,
    aiSummarizationCount: data.aiSummaryQueue?.length,
    placeTypesCount: data.allPlaceTypes?.length,
    locationRelationsCount: data.allLocationRelations?.length,
    groupsCount: data.allGroups?.length,
    groupTypesCount: data.allGroupTypes?.length,
    currentBookmarkCategories,
    hiddenSidebarGroups,
    advanced,
  };
}
