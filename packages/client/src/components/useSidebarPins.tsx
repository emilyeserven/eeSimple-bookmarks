import type { SidebarEntityData } from "./useSidebarEntityData";
import type { PinnedSidebarEntityType, PinnedSidebarItem } from "@eesimple/types";

import * as React from "react";

import { Filter, Globe, MapPin, MonitorPlay, Tags } from "lucide-react";

import { TAXONOMY_LISTING_PINS } from "./usePinManagerData";
import { bookmarkMatchesSearch, bookmarkSearchEquals, validateBookmarkSearch } from "../lib/bookmarkSearch";

import { CategoryIcon } from "@/lib/icons";

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
  /** The pin's grouping section, or `null` for the ungrouped bucket. */
  sectionId: string | null;
}

/** The sidebar data slices a pin resolver may read (a subset of {@link SidebarEntityData}). */
type PinResolveData = Pick<
  SidebarEntityData,
  "categories" | "allTags" | "allWebsites" | "allMediaTypes" | "allChannels" | "savedFilters"
  | "allBookmarks" | "allLocations"
>;

/** Everything a per-entity pin resolver needs beyond the pin itself. */
interface PinResolveContext {
  data: PinResolveData;
  pathname: string;
  currentBookmarkCategories: string[];
  currentBookmarkSearch: Record<string, unknown>;
}

// Resolvers don't know about grouping — `useResolvedPins` attaches each pin's `sectionId` afterward.
type PinResolver = (pin: PinnedSidebarItem, ctx: PinResolveContext) => Omit<ResolvedPin, "sectionId">[];

/**
 * One resolver per pinned entity type — each looks its entity up in the sidebar data and returns the
 * rendered pin (or `[]` when the entity is gone). Split out of a single switch so no one function is
 * over the complexity cap; a missing entity type simply resolves to nothing.
 */
export const PIN_RESOLVERS: Record<PinnedSidebarEntityType, PinResolver> = {
  "category": (pin, {
    data, currentBookmarkCategories,
  }) => {
    const e = (data.categories ?? []).find(c => c.id === pin.entityId);
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
  },
  "tag": (pin, {
    data, pathname,
  }) => {
    const e = (data.allTags ?? []).find(t => t.id === pin.entityId);
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
  },
  "website": (pin, {
    data, pathname,
  }) => {
    const e = (data.allWebsites ?? []).find(w => w.id === pin.entityId);
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
  },
  "media-type": (pin, {
    data, pathname,
  }) => {
    const e = (data.allMediaTypes ?? []).find(m => m.id === pin.entityId);
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
  },
  "youtube-channel": (pin, {
    data, pathname,
  }) => {
    const e = (data.allChannels ?? []).find(c => c.id === pin.entityId);
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
  },
  "saved-filter": (pin, {
    data, pathname, currentBookmarkSearch,
  }) => {
    const e = (data.savedFilters ?? []).find(f => f.id === pin.entityId);
    if (!e) return [];
    const search = validateBookmarkSearch(e.filters);
    const bookmarkCount = (data.allBookmarks ?? []).filter(b => bookmarkMatchesSearch(b, search)).length;
    return [{
      id: pin.id,
      label: e.name,
      icon: <Filter />,
      link: {
        kind: "filter",
        search,
      },
      bookmarkCount,
      isActive: pathname.startsWith("/bookmarks") && bookmarkSearchEquals(currentBookmarkSearch, e.filters),
    }];
  },
  "location": (pin, {
    data, pathname,
  }) => {
    const e = (data.allLocations ?? []).find(l => l.id === pin.entityId);
    if (!e) return [];
    return [{
      id: pin.id,
      label: e.name,
      icon: <MapPin />,
      link: {
        kind: "path",
        path: `/taxonomies/locations/${e.slug}`,
      },
      bookmarkCount: e.bookmarkCount,
      isActive: pathname.startsWith(`/taxonomies/locations/${e.slug}`),
    }];
  },
  "taxonomy-listing": (pin, {
    pathname,
  }) => {
    const listing = TAXONOMY_LISTING_PINS.find(l => l.key === pin.entityId);
    if (!listing) return [];
    return [{
      id: pin.id,
      label: listing.label,
      icon: <listing.Icon />,
      link: {
        kind: "path",
        path: listing.path,
      },
      isActive: pathname.startsWith(listing.path),
    }];
  },
};

/** Resolve each pinned item to its rendered shape (icon, link, count, active state). */
export function useResolvedPins(
  data: SidebarEntityData,
  pathname: string,
  currentBookmarkCategories: string[],
  currentBookmarkSearch: Record<string, unknown>,
): ResolvedPin[] {
  const {
    categories, allTags, allWebsites, allMediaTypes, allChannels, savedFilters, pinnedItems,
    allBookmarks, allLocations,
  } = data;
  return React.useMemo((): ResolvedPin[] => {
    // Rebuild the data bag from the granular slices so the memo tracks each slice (not `data`'s identity).
    const ctx: PinResolveContext = {
      data: {
        categories,
        allTags,
        allWebsites,
        allMediaTypes,
        allChannels,
        savedFilters,
        allBookmarks,
        allLocations,
      },
      pathname,
      currentBookmarkCategories,
      currentBookmarkSearch,
    };
    return pinnedItems.flatMap((pin: PinnedSidebarItem): ResolvedPin[] =>
      (PIN_RESOLVERS[pin.entityType as PinnedSidebarEntityType]?.(pin, ctx) ?? []).map(
        (resolved): ResolvedPin => ({
          ...resolved,
          sectionId: pin.sectionId,
        }),
      ));
  }, [pinnedItems, categories, allTags, allWebsites, allMediaTypes, allChannels, savedFilters,
    allBookmarks, allLocations, pathname, currentBookmarkCategories, currentBookmarkSearch]);
}

/**
 * Resolve the saved filters the user marked "viewable online" to sidebar filter-link shapes. These
 * surface as quick-access shortcuts in their own sidebar group (handy in the installed PWA), separate
 * from the manually-ordered pinned items.
 */
export function useViewableFilters(
  data: SidebarEntityData,
  pathname: string,
  currentBookmarkSearch: Record<string, unknown>,
): ResolvedPin[] {
  const {
    savedFilters, allBookmarks,
  } = data;
  return React.useMemo((): ResolvedPin[] => {
    return (savedFilters ?? [])
      .filter(filter => filter.viewableOnline)
      .map((filter): ResolvedPin => {
        const search = validateBookmarkSearch(filter.filters);
        const bookmarkCount = (allBookmarks ?? []).filter(b => bookmarkMatchesSearch(b, search)).length;
        return {
          id: filter.id,
          label: filter.name,
          icon: <Filter />,
          link: {
            kind: "filter",
            search,
          },
          bookmarkCount,
          isActive: pathname.startsWith("/bookmarks") && bookmarkSearchEquals(currentBookmarkSearch, filter.filters),
          sectionId: null,
        };
      });
  }, [savedFilters, allBookmarks, pathname, currentBookmarkSearch]);
}
