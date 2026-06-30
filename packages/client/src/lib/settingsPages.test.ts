import { describe, expect, it } from "vitest";

import { findSettingsPage, SETTINGS_PAGES } from "./settingsPages";

describe("settingsPages registry", () => {
  it("resolves a /settings sub-page by exact path", () => {
    const page = findSettingsPage("/settings/display/general");
    expect(page).toMatchObject({
      path: "/settings/display/general",
      label: "Display: General",
    });
    expect(page?.icon).toBeDefined();
  });

  it("resolves the tab pages nested inside the tabbed settings sections", () => {
    for (const path of [
      "/settings/display/filters",
      "/settings/automations/global",
      "/settings/automations/check-links",
      "/settings/automations/redirect-failures",
      "/settings/advanced/manage-data",
      "/settings/advanced/updates",
      "/settings/advanced/database-usage",
    ]) {
      const page = findSettingsPage(path);
      expect(page?.path).toBe(path);
      expect(page?.label).toBeTruthy();
      expect(page?.icon).toBeDefined();
    }
  });

  it("resolves a management page that lives outside /settings", () => {
    const page = findSettingsPage("/custom-properties");
    expect(page).toMatchObject({
      path: "/custom-properties",
      label: "Custom Properties",
    });
    expect(page?.icon).toBeDefined();
  });

  it("assigns every page an icon", () => {
    for (const page of SETTINGS_PAGES) {
      expect(page.icon).toBeDefined();
    }
  });

  it("returns undefined for non-settings pages", () => {
    expect(findSettingsPage("/bookmarks")).toBeUndefined();
    expect(findSettingsPage("/")).toBeUndefined();
  });

  it("matches exactly, not by prefix (detail pages are not favoritable)", () => {
    expect(findSettingsPage("/custom-properties/some-slug")).toBeUndefined();
    expect(findSettingsPage("/settings/display/extra")).toBeUndefined();
  });

  it("has unique paths", () => {
    const paths = SETTINGS_PAGES.map(p => p.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
