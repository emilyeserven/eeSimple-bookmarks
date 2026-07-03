import type { ToolbarContext } from "./toolbarActions";

import { describe, expect, it, vi } from "vitest";

import { buildToolbarActions } from "./toolbarActions";

function ctx(overrides: Partial<ToolbarContext> = {}): ToolbarContext {
  return {
    // A non-homepage path by default — an empty `pathParts` is the homepage, which adds the
    // homepage-only `homepage-settings` action (covered by its own test below).
    pathParts: ["bookmarks"],
    headerSearchActive: false,
    listingPage: null,
    bulkSelectPageKey: null,
    isBookmarkDetail: false,
    bookmarkId: "b1",
    addChild: null,
    settingsPage: null,
    pinContext: null,
    openPanel: vi.fn(),
    syncProvider: null,
    ...overrides,
  };
}

const SAMPLE_SYNC_PROVIDER: ToolbarContext["syncProvider"] = {
  descriptorKind: "location",
  entityLabel: "Tokyo",
  entityId: "loc1",
  supportsRegeocode: true,
  applyStaged: vi.fn(),
};

const keys = (c: ToolbarContext) => buildToolbarActions(c).map(a => a.key);

describe("buildToolbarActions", () => {
  it("always includes the panel toggle last, even with an otherwise-empty context", () => {
    expect(keys(ctx())).toEqual(["open-panel"]);
  });

  it("adds the search bar only when header search is active", () => {
    expect(keys(ctx({
      headerSearchActive: true,
    }))).toEqual(["search-bar", "open-panel"]);
  });

  it("adds filter + display + create for a listing page with filters and a create action", () => {
    const createAction = vi.fn();
    expect(
      keys(ctx({
        listingPage: {
          key: "bookmarks",
          hasFilters: true,
          createAction,
        },
      })),
    ).toEqual(["filter-location", "display-options", "create", "open-panel"]);
  });

  it("omits filter-location when the listing page has no filters", () => {
    expect(keys(ctx({
      listingPage: {
        key: "categories-listing",
        hasFilters: false,
      },
    }))).toEqual([
      "display-options",
      "open-panel",
    ]);
  });

  it("adds the bulk-select toggle when a bulk-selectable listing is mounted", () => {
    expect(keys(ctx({
      bulkSelectPageKey: "websites-listing",
    }))).toEqual(["bulk-select", "open-panel"]);
  });

  it("places the bulk-select toggle right after display-options", () => {
    expect(keys(ctx({
      listingPage: {
        key: "categories-listing",
        hasFilters: false,
      },
      bulkSelectPageKey: "categories-listing",
    }))).toEqual(["display-options", "bulk-select", "open-panel"]);
  });

  it("adds layout + edit for a bookmark detail", () => {
    expect(keys(ctx({
      isBookmarkDetail: true,
    }))).toEqual([
      "bookmark-layout",
      "edit-bookmark",
      "open-panel",
    ]);
  });

  it("adds the sync-from-source action only when an edit form registers a sync provider", () => {
    expect(keys(ctx())).not.toContain("sync-from-source");
    expect(keys(ctx({
      syncProvider: SAMPLE_SYNC_PROVIDER,
    }))).toContain("sync-from-source");
  });

  it("places sync-from-source right after edit-bookmark on a bookmark edit surface", () => {
    expect(keys(ctx({
      isBookmarkDetail: true,
      syncProvider: SAMPLE_SYNC_PROVIDER,
    }))).toEqual([
      "bookmark-layout",
      "edit-bookmark",
      "sync-from-source",
      "open-panel",
    ]);
  });

  it("adds homepage-settings on the homepage, just before the panel toggle", () => {
    expect(keys(ctx({
      pathParts: [],
    }))).toEqual(["homepage-settings", "open-panel"]);
  });

  it("omits homepage-settings off the homepage", () => {
    expect(keys(ctx({
      pathParts: ["bookmarks"],
    }))).not.toContain("homepage-settings");
  });

  it("adds the view-details link on a taxonomy item path", () => {
    expect(keys(ctx({
      pathParts: ["categories", "reading"],
    }))).toContain("view-details");
  });

  it("preserves a stable left-to-right order across all present actions", () => {
    const all = ctx({
      headerSearchActive: true,
      listingPage: {
        key: "bookmarks",
        hasFilters: true,
        createAction: vi.fn(),
      },
      pathParts: ["tags", "dev"],
      settingsPage: {
        path: "/settings/display",
        label: "Display",
      } as unknown as ToolbarContext["settingsPage"],
      pinContext: {
        entityType: "category",
        entityId: "c1",
      } as unknown as ToolbarContext["pinContext"],
    });
    expect(keys(all)).toEqual([
      "search-bar",
      "filter-location",
      "display-options",
      "view-details",
      "create",
      "settings-favorite",
      "pin",
      "open-panel",
    ]);
  });
});
