// @vitest-environment node
import type { ToolbarContext } from "./toolbarActions";

import { describe, expect, it, vi } from "vitest";

import { buildToolbarActions } from "./toolbarActions";

function ctx(overrides: Partial<ToolbarContext> = {}): ToolbarContext {
  return {
    // A non-homepage path by default — an empty `pathParts` is the homepage, which adds the
    // homepage-only `homepage-settings` action (covered by its own test below).
    pathParts: ["bookmarks"],
    listingPage: null,
    isBookmarkDetail: false,
    bookmarkId: "b1",
    addChild: null,
    settingsPage: null,
    pinContext: null,
    favoriteContext: null,
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
  it("returns an empty list for an otherwise-empty context", () => {
    expect(keys(ctx())).toEqual([]);
  });

  it("adds create for a listing page with a create action (display controls + filters/sort now live in the on-page box)", () => {
    const createAction = vi.fn();
    expect(
      keys(ctx({
        listingPage: {
          key: "bookmarks",
          hasFilters: true,
          createAction,
        },
      })),
    ).toEqual(["create"]);
  });

  it("no longer adds a header bulk-select toggle (it moved into the on-page display-options box)", () => {
    expect(keys(ctx({
      listingPage: {
        key: "categories-listing",
        hasFilters: false,
      },
    }))).not.toContain("bulk-select");
  });

  it("adds layout + edit for a bookmark detail", () => {
    expect(keys(ctx({
      isBookmarkDetail: true,
    }))).toEqual([
      "bookmark-layout",
      "edit-bookmark",
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
    ]);
  });

  it("adds homepage-settings on the homepage", () => {
    expect(keys(ctx({
      pathParts: [],
    }))).toEqual(["homepage-settings"]);
  });

  it("omits homepage-settings off the homepage", () => {
    expect(keys(ctx({
      pathParts: ["bookmarks"],
    }))).not.toContain("homepage-settings");
  });

  it("never adds the removed view-details link (Info is now a listing tab)", () => {
    expect(keys(ctx({
      pathParts: ["categories", "reading"],
    }))).not.toContain("view-details");
  });

  it("adds the edit link on the bare listing, its gallery/media/info tabs, and taxonomy items", () => {
    // Edit now shows on the entity-scoped bookmarks index (it replaced the old Info button there).
    expect(keys(ctx({
      pathParts: ["categories", "reading"],
    }))).toContain("edit-taxonomy");
    expect(keys(ctx({
      pathParts: ["categories", "reading", "info"],
    }))).toContain("edit-taxonomy");
    expect(keys(ctx({
      pathParts: ["taxonomies", "websites", "syntax"],
    }))).toContain("edit-taxonomy");
  });

  it("omits the edit link on the listing-of-all index (no slug)", () => {
    expect(keys(ctx({
      pathParts: ["categories"],
    }))).not.toContain("edit-taxonomy");
  });

  it("omits the edit link on an edit tab", () => {
    expect(keys(ctx({
      pathParts: ["categories", "reading", "edit", "general"],
    }))).not.toContain("edit-taxonomy");
  });

  it("adds the favorite (star) action only when a favoriteContext is present", () => {
    expect(keys(ctx())).not.toContain("favorite-taxonomy");
    expect(keys(ctx({
      favoriteContext: {
        entityType: "category",
        entityId: "c1",
        label: "Reading",
      },
    }))).toContain("favorite-taxonomy");
  });

  it("preserves a stable left-to-right order across all present actions", () => {
    const all = ctx({
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
      favoriteContext: {
        entityType: "tag",
        entityId: "t1",
        label: "dev",
      },
      pinContext: {
        entityType: "category",
        entityId: "c1",
      } as unknown as ToolbarContext["pinContext"],
    });
    expect(keys(all)).toEqual([
      "edit-taxonomy",
      "create",
      "settings-favorite",
      "favorite-taxonomy",
      "pin",
    ]);
  });
});
