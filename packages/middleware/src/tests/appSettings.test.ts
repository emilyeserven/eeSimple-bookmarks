import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";

// Schema-validation tests via `inject` (no database needed) for the app-settings groups that moved
// off per-device local storage (issue #410): sidebar-customization, automation, display-preferences.
// Fastify validates the PUT body before the handler runs, so an invalid payload 400s without a DB.

test("PUT /api/app-settings/automation rejects an unknown modifier", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/api/app-settings/automation",
    payload: {
      autoFetchTitle: true,
      autoFetchImage: true,
      autoApplyTitleTags: false,
      sidebarOpenModifier: "hyper",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PUT /api/app-settings/automation rejects a missing field", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/api/app-settings/automation",
    payload: {
      autoFetchTitle: true,
      sidebarOpenModifier: "alt",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PUT /api/app-settings/display-preferences rejects a non-integer cropped width", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/api/app-settings/display-preferences",
    payload: {
      bookmarkDetailImageSize: "medium",
      bookmarkDetailVideoSize: "standard",
      bookmarkDetailLayout: "single",
      filtersInDrawer: false,
      filtersHidden: false,
      panelPinned: false,
      drawerUnpinnedBreakpoints: [768],
      croppedWidth: 1.5,
      croppedHeight: 9,
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PUT /api/app-settings/display-preferences rejects an out-of-range detail size", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/api/app-settings/display-preferences",
    payload: {
      bookmarkDetailImageSize: "huge",
      bookmarkDetailVideoSize: "standard",
      bookmarkDetailLayout: "single",
      filtersInDrawer: false,
      filtersHidden: false,
      panelPinned: false,
      drawerUnpinnedBreakpoints: [768],
      croppedWidth: 16,
      croppedHeight: 9,
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PUT /api/app-settings/sidebar-customization rejects a missing hidden list", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/api/app-settings/sidebar-customization",
    payload: {
      hiddenCategoryIds: [],
      hiddenTaxonomyItems: [],
      hiddenCustomizationItems: [],
      hiddenManagementItems: [],
      // hiddenSidebarGroups omitted — it is required.
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PUT /api/app-settings/sidebar-customization rejects a non-string hidden-list item", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/api/app-settings/sidebar-customization",
    payload: {
      hiddenCategoryIds: [{
        notAString: true,
      }],
      hiddenTaxonomyItems: [],
      hiddenCustomizationItems: [],
      hiddenManagementItems: [],
      hiddenSidebarGroups: [],
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
