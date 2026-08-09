// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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
      "/settings/display/bookmark-add",
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

  it("resolves the standalone Insights dashboard page", () => {
    const page = findSettingsPage("/insights");
    expect(page).toMatchObject({
      path: "/insights",
      label: "Insights",
    });
    expect(page?.icon).toBeDefined();
  });

  it("resolves the standalone Page Layouts settings section", () => {
    const page = findSettingsPage("/settings/page-layouts");
    expect(page).toMatchObject({
      path: "/settings/page-layouts",
      label: "Page Layouts",
    });
    expect(page?.icon).toBeDefined();
  });

  it("no longer registers Page Layouts as a Display sub-tab", () => {
    expect(findSettingsPage("/settings/display/page-layouts")).toBeUndefined();
  });

  it("resolves the Place Types taxonomy listing page", () => {
    const page = findSettingsPage("/taxonomies/place-types");
    expect(page).toMatchObject({
      path: "/taxonomies/place-types",
      label: "Place Types",
    });
    expect(page?.icon).toBeDefined();
  });

  it("resolves the Language Usage Levels overview reachable from the Languages flyout", () => {
    const page = findSettingsPage("/taxonomies/language-usage-levels");
    expect(page).toMatchObject({
      path: "/taxonomies/language-usage-levels",
      label: "Usage Levels",
    });
    expect(page?.icon).toBeDefined();
  });

  it("resolves the Language Usage Levels edit page reachable from the overview", () => {
    const page = findSettingsPage("/taxonomies/language-usage-levels/edit");
    expect(page).toMatchObject({
      path: "/taxonomies/language-usage-levels/edit",
      label: "Usage Levels: Edit",
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

  it("resolves the standalone Bookmark Relationships editor page", () => {
    const page = findSettingsPage("/settings/relationships");
    expect(page).toMatchObject({
      path: "/settings/relationships",
      label: "Bookmark Relationships",
    });
    expect(page?.icon).toBeDefined();
  });

  it("has unique paths", () => {
    const paths = SETTINGS_PAGES.map(p => p.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

// ─── Route walk ───────────────────────────────────────────────────────────────
// The blind spot that let /settings/{custom-properties,websites,media-types,youtube-channels} ship
// as unregistered live pages: nothing asserted that every live route under /settings/** and
// /taxonomies/** resolves via `findSettingsPage`. Walk the route files directly (redirect routes are
// never a live pathname and are excluded; so are $-param detail routes and pathless _hub layouts).

const ROUTES_DIR = fileURLToPath(new URL("../routes", import.meta.url));

/** The live (non-redirect) leaf pathnames under /settings/** and /taxonomies/**. */
function liveLeafPaths(): string[] {
  const names = readdirSync(ROUTES_DIR)
    .filter(file => file.endsWith(".tsx") && !file.startsWith("-"))
    .map(file => file.slice(0, -".tsx".length));
  const isRedirect = (name: string) =>
    readFileSync(join(ROUTES_DIR, `${name}.tsx`), "utf8").includes("throw redirect(");
  const hasChildren = (name: string) => names.some(other => other.startsWith(`${name}.`));

  const paths = new Set<string>();
  for (const name of names) {
    const segments = name.split(".");
    // Skip $-param detail/edit routes, pathless layouts, and everything off the two surfaces.
    if (segments.some(segment => segment.startsWith("$") || segment.startsWith("_"))) continue;
    if (isRedirect(name)) continue;

    if (segments[0] === "settings") {
      // The /settings landing hub itself is deliberately unregistered (like the section parents,
      // it's a navigation hub, not a favoritable page).
      if (name === "settings.index") continue;
      // A parent shell (settings.display over settings.display.*) renders its children, which are
      // walked individually.
      if (segments[segments.length - 1] !== "index" && hasChildren(name)) continue;
      const pathSegments = segments[segments.length - 1] === "index" ? segments.slice(0, -1) : segments;
      paths.add(`/${pathSegments.join("/")}`);
      continue;
    }

    if (segments[0] === "taxonomies") {
      // Listing index leaves (`taxonomies.<x>.index`) plus child-less standalone leaves
      // (`taxonomies.translation-sources`). Non-index sub-pages (create pages, the usage-levels
      // edit screen) are out of the walk's scope.
      if (segments.length === 3 && segments[2] === "index") {
        paths.add(`/taxonomies/${segments[1]}`);
      }
      else if (segments.length === 2 && !hasChildren(name)) {
        paths.add(`/taxonomies/${segments[1]}`);
      }
    }
  }
  return [...paths].sort();
}

describe("settings/taxonomies route walk", () => {
  it("finds live routes on both surfaces (walk sanity check)", () => {
    const paths = liveLeafPaths();
    expect(paths).toContain("/settings/display/general");
    expect(paths).toContain("/settings/relationships");
    expect(paths).toContain("/taxonomies/websites");
    expect(paths).toContain("/taxonomies/translation-sources");
    // Redirect routes stay out of the walk.
    expect(paths).not.toContain("/settings/websites");
    expect(paths).not.toContain("/settings/saved-filters");
  });

  it("registers every live /settings/** and /taxonomies/** leaf as a favoritable page", () => {
    for (const path of liveLeafPaths()) {
      expect(findSettingsPage(path), `live route ${path} must resolve via findSettingsPage — register it (settingsNav / sidebarNavItems / STANDALONE_PAGES) or make the route a redirect`).toBeDefined();
    }
  });
});
