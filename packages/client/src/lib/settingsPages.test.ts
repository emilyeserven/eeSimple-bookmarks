// @vitest-environment node
import { describe, expect, it } from "vitest";

import { findSettingsPage, SETTINGS_PAGES } from "./settingsPages";
import { actionItems, customizationItems, taxonomyItems } from "./sidebarNavItems";
import { SETTINGS_TAB_SECTIONS } from "./settingsNav";

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
      "/settings/automations/backfill",
      "/settings/automations/check-links",
      "/settings/automations/redirect-failures",
      "/settings/advanced/manage-data",
      "/settings/advanced/updates",
      "/settings/advanced/database-usage",
      "/settings/locations/level-groups",
      "/settings/locations/pin-style",
      "/settings/locations/place-types",
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

  it("resolves the Place Types taxonomy listing page", () => {
    const page = findSettingsPage("/taxonomies/place-types");
    expect(page).toMatchObject({
      path: "/taxonomies/place-types",
      label: "Place Types",
    });
    expect(page?.icon).toBeDefined();
  });

  it("derives an entry for every sidebar taxonomy/action/customization item", () => {
    for (const item of [...taxonomyItems, ...actionItems, ...customizationItems]) {
      const page = findSettingsPage(item.to);
      expect(page, `sidebar item ${item.to} must be favoritable`).toBeDefined();
      expect(page?.icon).toBe(item.icon);
    }
  });

  it("derives an entry for every tab of every tabbed settings section", () => {
    for (const {
      section, items,
    } of SETTINGS_TAB_SECTIONS) {
      for (const item of items) {
        const page = findSettingsPage(item.to as string);
        expect(page, `settings tab ${item.to} must be favoritable`).toBeDefined();
        expect(page?.label).toBe(`${section}: ${item.label}`);
      }
    }
  });

  it("resolves the pages that were once missing from the hand-maintained list", () => {
    for (const path of [
      "/taxonomies/people",
      "/taxonomies/groups",
      "/taxonomies/locations",
      "/taxonomies/newsletters",
      "/import-rules",
      "/saved-filters",
    ]) {
      expect(findSettingsPage(path)?.label).toBeTruthy();
    }
  });

  it("labels the newsletters listing distinctly from Automations: Imports", () => {
    expect(findSettingsPage("/taxonomies/newsletters")?.label).toBe("Newsletters");
    expect(findSettingsPage("/settings/automations/imports")?.label).toBe("Automations: Imports");
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
