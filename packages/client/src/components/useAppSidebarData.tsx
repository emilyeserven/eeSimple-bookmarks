import type { PinnedSidebarEntityType, PinnedSidebarItem } from "@eesimple/types";

import * as React from "react";

import { useRouterState } from "@tanstack/react-router";
import { Filter, Globe, MonitorPlay, Tags } from "lucide-react";

import { useViewPanelClick } from "./panel/useEditPanelClick";
import {
  useAdvancedSettings,
  useSidebarOpenModifier,
  useSidebarVisibility,
} from "../hooks/useAppSettings";
import { useAuthors } from "../hooks/useAuthors";
import { useAutofillRules } from "../hooks/useAutofill";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useInboxItems } from "../hooks/useImports";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useNewsletters } from "../hooks/useNewsletters";
import { usePinnedSidebarItems } from "../hooks/usePinnedSidebarItems";
import { usePropertyGroups } from "../hooks/usePropertyGroups";
import { useSavedFilters } from "../hooks/useSavedFilters";
import { useTags } from "../hooks/useTags";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { bookmarkMatchesSearch, validateBookmarkSearch } from "../lib/bookmarkSearch";

import { CategoryIcon } from "@/lib/icons";

const PINNED_INITIAL = 5;
const PINNED_EXPANDED = 10;

export interface ResolvedPin {
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

/** The expand/collapse state that gates how many pins are shown. */
export interface PinPaginationState {
  pinnedExpanded: boolean;
  pinnedShowAll: boolean;
}

export interface PinPagination {
  visiblePins: ResolvedPin[];
  hasShowMore: boolean;
  hasSeeAll: boolean;
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
  };
}

/** All the entity lists the sidebar renders, fetched in one place. */
function useSidebarEntityData() {
  return {
    allBookmarks: useBookmarks().data,
    inboxItems: useInboxItems().data,
    categories: useCategories().data,
    allTags: useTags().data,
    allWebsites: useWebsites().data,
    allMediaTypes: useMediaTypes().data,
    allChannels: useYouTubeChannels().data,
    allNewsletters: useNewsletters().data,
    allAuthors: useAuthors().data,
    allCustomProperties: useCustomProperties().data,
    allPropertyGroups: usePropertyGroups().data,
    allAutofillRules: useAutofillRules().data,
    pinnedItems: usePinnedSidebarItems().data ?? [],
    savedFilters: useSavedFilters().data,
  };
}

/** The Advanced-section external links resolved from app settings (each independently gated). */
export interface SidebarAdvanced {
  coolifyLinkEnabled: boolean;
  coolifyUrl: string;
  docsLinkEnabled: boolean;
  storybookLinkEnabled: boolean;
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
  visibleCategories: NonNullable<ReturnType<typeof useCategories>["data"]>;
  seeMoreCategories: NonNullable<ReturnType<typeof useCategories>["data"]>;
  categoriesExpanded: boolean;
  setCategoriesExpanded: (v: boolean) => void;
  visibleTaxonomyItems: (T & { count: number | undefined })[];
  visibleCustomizationItems: (C & { count: number | undefined })[];
  resolvedPins: ResolvedPin[];
  pinnedExpanded: boolean;
  setPinnedExpanded: (v: boolean) => void;
  pinnedShowAll: boolean;
  setPinnedShowAll: (v: boolean) => void;
  pagination: PinPagination;
  allBookmarks: ReturnType<typeof useBookmarks>["data"];
  inboxCount: number | undefined;
  currentBookmarkCategories: string[];
  modifier: ReturnType<typeof useSidebarOpenModifier>;
  viewClick: ReturnType<typeof useViewPanelClick>;
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
  const data = useSidebarEntityData();
  const [pinnedExpanded, setPinnedExpanded] = React.useState(false);
  const [pinnedShowAll, setPinnedShowAll] = React.useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = React.useState(false);
  const {
    hiddenCategoryIds,
    seeMoreCategoryIds,
    hiddenTaxonomyItems,
    hiddenCustomizationItems,
    hiddenSidebarGroups,
  } = useSidebarVisibility();
  const modifier = useSidebarOpenModifier();
  const advanced = useSidebarAdvanced();
  const viewClick = useViewPanelClick();

  const visibleCategories = (data.categories ?? []).filter(
    c => !hiddenCategoryIds.includes(c.id) && !seeMoreCategoryIds.includes(c.id),
  );

  const seeMoreCategories = (data.categories ?? []).filter(
    c => !hiddenCategoryIds.includes(c.id) && seeMoreCategoryIds.includes(c.id),
  );

  const visibleTaxonomyItems = withVisibleCounts(taxonomyItems, hiddenTaxonomyItems, {
    "categories": data.categories?.length,
    "tags": data.allTags?.length,
    "websites": data.allWebsites?.length,
    "media-types": data.allMediaTypes?.length,
    "youtube-channels": data.allChannels?.length,
    "newsletters": data.allNewsletters?.length,
    "authors": data.allAuthors?.length,
  });

  const visibleCustomizationItems = withVisibleCounts(customizationItems, hiddenCustomizationItems, {
    "custom-properties": data.allCustomProperties?.length,
    "property-groups": data.allPropertyGroups?.length,
    "autofill": data.allAutofillRules?.length,
  });

  const resolvedPins = useResolvedPins(data, pathname, currentBookmarkCategories);
  const pagination = paginatePins(resolvedPins, {
    pinnedExpanded,
    pinnedShowAll,
  });

  return {
    pathname,
    visibleCategories,
    seeMoreCategories,
    categoriesExpanded,
    setCategoriesExpanded,
    visibleTaxonomyItems,
    visibleCustomizationItems,
    resolvedPins,
    pinnedExpanded,
    setPinnedExpanded,
    pinnedShowAll,
    setPinnedShowAll,
    pagination,
    allBookmarks: data.allBookmarks,
    inboxCount: data.inboxItems?.filter(item => item.status === "pending").length,
    currentBookmarkCategories,
    modifier,
    viewClick,
    hiddenSidebarGroups,
    advanced,
  };
}

/** Resolve each pinned item to its rendered shape (icon, link, count, active state). */
function useResolvedPins(
  data: ReturnType<typeof useSidebarEntityData>,
  pathname: string,
  currentBookmarkCategories: string[],
): ResolvedPin[] {
  const {
    categories, allTags, allWebsites, allMediaTypes, allChannels, savedFilters, pinnedItems,
    allBookmarks,
  } = data;
  return React.useMemo((): ResolvedPin[] => {
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
              kind: "filter",
              search: validateBookmarkSearch({
                categories: [e.id],
              }),
            },
            bookmarkCount: e.bookmarkCount,
            isActive: currentBookmarkCategories.includes(e.id),
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
          const search = validateBookmarkSearch(e.filters);
          const bookmarkCount = (allBookmarks ?? []).filter(b => bookmarkMatchesSearch(b, search)).length;
          return [{
            id: pin.id,
            label: e.name,
            icon: <Filter />,
            link: {
              kind: "filter",
              search,
            },
            bookmarkCount,
            isActive: pathname === "/bookmarks" || pathname === "/bookmarks/",
          }];
        }
      }
    });
  }, [pinnedItems, categories, allTags, allWebsites, allMediaTypes, allChannels, savedFilters,
    allBookmarks, pathname, currentBookmarkCategories]);
}
