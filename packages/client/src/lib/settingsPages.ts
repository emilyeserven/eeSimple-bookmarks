import type { LucideIcon } from "lucide-react";

import { Captions, ClipboardList, Languages, LayoutDashboard, MapPinned, Puzzle, Shapes, Tags, Waypoints } from "lucide-react";

import { SETTINGS_TAB_SECTIONS } from "./settingsNav";
import { actionItems, customizationItems, taxonomyItems } from "./sidebarNavItems";
import i18n from "../i18n";

/**
 * Registry of pages that can be favorited as "Settings pages". This is the single source of truth
 * for **which** pages show the header star button, **what label** a favorited path renders with,
 * and **which icon** it shows in the sidebar Settings flyout. Only the `path` is persisted
 * server-side (see `FavoriteSettingsPage`); the label and icon are resolved from here, so a
 * favorited path no longer in this list is simply skipped on render.
 *
 * The list is **derived**, not hand-maintained:
 * - The tab pages inside the tabbed settings sections come from `SETTINGS_TAB_SECTIONS`
 *   (`lib/settingsNav.ts`) as `"Section: Tab"` — adding a tab there registers it automatically.
 *   Section parents (`/settings/display`, …) are intentionally absent: their index routes redirect
 *   to the first tab, so the parent path is never the live pathname and could never match.
 * - The management/customization listing pages outside `/settings/*` come from the sidebar's
 *   `taxonomyItems` / `actionItems` / `customizationItems` (`lib/sidebarNavItems.ts`) — adding a
 *   sidebar entry registers its page automatically.
 * - Only pages on neither surface are hand-listed in `STANDALONE_PAGES` below.
 */
export interface SettingsPage {
  path: string;
  label: string;
  icon: LucideIcon;
}

/** Favoritable pages that appear on neither the sidebar nor a tabbed settings section. */
const STANDALONE_PAGES: readonly SettingsPage[] = [
  {
    // A tab-less /settings leaf (see `settingsNav` in routes/settings.tsx).
    path: "/settings/extension",
    label: i18n.t("Extension"),
    icon: Puzzle,
  },
  {
    // User-configurable taxonomies manager, reached from the sidebar Taxonomies section header.
    // Labelled "Manage Taxonomies" to disambiguate from the built-in "Taxonomies" nav group.
    path: "/settings/taxonomies",
    label: i18n.t("Manage Taxonomies"),
    icon: Tags,
  },
  {
    // A tab-less /settings leaf (see `settingsNav` in routes/settings.tsx).
    path: "/settings/page-layouts",
    label: i18n.t("Page Layouts"),
    icon: LayoutDashboard,
  },
  {
    // A tab-less /settings leaf (see `settingsNav` in routes/settings.tsx).
    path: "/settings/parse-templates",
    label: i18n.t("Parse Templates"),
    icon: ClipboardList,
  },
  {
    // Listing page reachable from Locations, not from the sidebar.
    path: "/taxonomies/place-types",
    label: i18n.t("Place Types"),
    icon: MapPinned,
  },
  {
    // Listing page reachable from the Locations flyout, not directly from the sidebar.
    path: "/taxonomies/location-relations",
    label: i18n.t("Location Relations"),
    icon: Waypoints,
  },
  {
    // Listing page reachable from the Groups flyout, not directly from the sidebar.
    path: "/taxonomies/group-types",
    label: i18n.t("Group Types"),
    icon: Shapes,
  },
  {
    // Overview reachable from the Languages flyout, not directly from the sidebar.
    path: "/taxonomies/language-usage-levels",
    label: i18n.t("Usage Levels"),
    icon: Captions,
  },
  {
    // Grouped-card CRUD reachable from the Usage Levels overview's "Edit levels" button.
    path: "/taxonomies/language-usage-levels/edit",
    label: i18n.t("Usage Levels: Edit"),
    icon: Captions,
  },
  {
    // CRUD reachable from the Languages flyout, not directly from the sidebar.
    path: "/taxonomies/translation-sources",
    label: i18n.t("Translation Sources"),
    icon: Languages,
  },
];

/** Favorite labels that differ from the sidebar item's title. */
const SIDEBAR_LABEL_OVERRIDES: Record<string, string> = {
  // The sidebar labels newsletters "Imports"; disambiguate from Automations: Imports.
  "/taxonomies/newsletters": i18n.t("Newsletters"),
};

const settingsTabPages: SettingsPage[] = SETTINGS_TAB_SECTIONS.flatMap(({
  section, items,
}) =>
  items.map(item => ({
    path: item.to as string,
    label: `${section}: ${item.label}`,
    icon: item.icon,
  })));

const sidebarPage = (item: { to: string;
  title: string;
  icon: LucideIcon; }): SettingsPage => ({
  path: item.to,
  label: SIDEBAR_LABEL_OVERRIDES[item.to] ?? item.title,
  icon: item.icon,
});

/** The sidebar-derived favoritable pages, sliced for consumers like the CMD+K nav groups. */
export const TAXONOMY_LISTING_PAGES: readonly SettingsPage[] = taxonomyItems.map(sidebarPage);
export const ACTION_LISTING_PAGES: readonly SettingsPage[] = actionItems.map(sidebarPage);
export const CUSTOMIZATION_LISTING_PAGES: readonly SettingsPage[]
  = customizationItems.map(sidebarPage);

export const SETTINGS_PAGES: readonly SettingsPage[] = [
  ...settingsTabPages,
  ...STANDALONE_PAGES,
  ...TAXONOMY_LISTING_PAGES,
  ...ACTION_LISTING_PAGES,
  ...CUSTOMIZATION_LISTING_PAGES,
];

/** The favoritable settings page for an exact pathname, or `undefined` if the page isn't one. */
export function findSettingsPage(pathname: string): SettingsPage | undefined {
  return SETTINGS_PAGES.find(page => page.path === pathname);
}
