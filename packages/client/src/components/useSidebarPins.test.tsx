import type { PinnedSidebarItem } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { PIN_RESOLVERS } from "./useSidebarPins";

function pin(overrides: Partial<PinnedSidebarItem> & Pick<PinnedSidebarItem, "entityType">): PinnedSidebarItem {
  return {
    id: "pin-1",
    entityId: "e1",
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const emptyData = {
  categories: [],
  allTags: [],
  allWebsites: [],
  allMediaTypes: [],
  allChannels: [],
  savedFilters: [],
  allBookmarks: [],
  allLocations: [],
};

/** Minimal context; individual tests widen `data` with the one slice they exercise. */
function ctx(data: Partial<typeof emptyData> = {}) {
  return {
    data: {
      ...emptyData,
      ...data,
    } as never,
    pathname: "/",
    currentBookmarkCategories: [] as string[],
    currentBookmarkSearch: {},
  };
}

describe("PIN_RESOLVERS", () => {
  it("resolves a category pin to a filter link, active when the category is the current filter", () => {
    const category = {
      id: "e1",
      name: "News",
      icon: null,
      slug: "news",
      bookmarkCount: 4,
    };
    const resolved = PIN_RESOLVERS.category(
      pin({
        entityType: "category",
      }),
      {
        ...ctx({
          categories: [category] as never,
        }),
        currentBookmarkCategories: ["e1"],
      },
    );
    expect(resolved).toHaveLength(1);
    expect(resolved[0]).toMatchObject({
      label: "News",
      bookmarkCount: 4,
      isActive: true,
      link: {
        kind: "filter",
      },
    });
  });

  it("resolves a tag pin to a path link, active when the pathname matches", () => {
    const tag = {
      id: "e1",
      name: "React",
      slug: "react",
      bookmarkCount: 2,
    };
    const resolved = PIN_RESOLVERS.tag(
      pin({
        entityType: "tag",
      }),
      {
        ...ctx({
          allTags: [tag] as never,
        }),
        pathname: "/tags/react",
      },
    );
    expect(resolved[0]).toMatchObject({
      label: "React",
      isActive: true,
      link: {
        kind: "path",
        path: "/tags/react",
      },
    });
  });

  it("resolves to an empty array when the referenced entity no longer exists", () => {
    expect(PIN_RESOLVERS.website(pin({
      entityType: "website",
    }), ctx())).toEqual([]);
    expect(PIN_RESOLVERS.location(pin({
      entityType: "location",
    }), ctx())).toEqual([]);
  });

  it("has a resolver for every pinned entity type", () => {
    // A missing resolver would make that pin silently vanish from the sidebar.
    expect(Object.keys(PIN_RESOLVERS).sort()).toEqual([
      "category", "location", "media-type", "saved-filter", "tag", "taxonomy-listing",
      "website", "youtube-channel",
    ]);
  });
});
