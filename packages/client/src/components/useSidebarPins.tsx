import type { SidebarEntityData } from "./useSidebarEntityData";
import type { PinnedSidebarEntityType, PinnedSidebarItem } from "@eesimple/types";

import * as React from "react";

import { Filter, Globe, MonitorPlay, Tags } from "lucide-react";

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
}

/** Resolve each pinned item to its rendered shape (icon, link, count, active state). */
export function useResolvedPins(
  data: SidebarEntityData,
  pathname: string,
  currentBookmarkCategories: string[],
  currentBookmarkSearch: Record<string, unknown>,
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
            isActive: pathname.startsWith("/bookmarks") && bookmarkSearchEquals(currentBookmarkSearch, e.filters),
          }];
        }
      }
    });
  }, [pinnedItems, categories, allTags, allWebsites, allMediaTypes, allChannels, savedFilters,
    allBookmarks, pathname, currentBookmarkCategories, currentBookmarkSearch]);
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
        };
      });
  }, [savedFilters, allBookmarks, pathname, currentBookmarkSearch]);
}
