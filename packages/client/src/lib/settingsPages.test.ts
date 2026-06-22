import { describe, expect, it } from "vitest";

import { findSettingsPage, SETTINGS_PAGES } from "./settingsPages";

describe("settingsPages registry", () => {
  it("resolves a /settings sub-page by exact path", () => {
    expect(findSettingsPage("/settings/display")).toEqual({
      path: "/settings/display",
      label: "Display",
    });
  });

  it("resolves a management page that lives outside /settings", () => {
    expect(findSettingsPage("/custom-properties")).toEqual({
      path: "/custom-properties",
      label: "Custom Properties",
    });
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
