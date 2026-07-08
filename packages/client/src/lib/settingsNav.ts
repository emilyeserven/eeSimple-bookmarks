import type { TabNavItem } from "../components/TabbedEntityLayout";
import type { LucideIcon } from "lucide-react";

import {
  Cable,
  Camera,
  Database,
  Filter,
  FolderOpen,
  Forward,
  HardDrive,
  History,
  Image,
  Inbox,
  Languages,
  LayoutTemplate,
  Link2,
  ListChecks,
  MapPin,
  Monitor,
  PanelLeft,
  RefreshCw,
  Share2,
  SquarePlus,
  Wand2,
  Waypoints,
} from "lucide-react";

import i18n from "../i18n";

/**
 * The tab-nav data for the tabbed settings sections, extracted so registries can derive from it.
 * The section routes (`settings.display.tsx`, `settings.automations.tsx`, `settings.locations.tsx`,
 * `settings.advanced.tsx`) render these navs; `lib/settingsPages.ts` derives each tab's favoritable
 * entry (`"Section: Tab"` label + the tab's `icon`) from `SETTINGS_TAB_SECTIONS`, so adding a tab
 * here automatically makes it favoritable — no separate registration. Pick an `icon` distinct from
 * the tab's siblings.
 */
export interface SettingsTabNavItem extends TabNavItem {
  icon: LucideIcon;
}

export const displayNav: readonly SettingsTabNavItem[] = [
  {
    to: "/settings/display/general",
    label: i18n.t("General"),
    icon: Monitor,
  },
  {
    to: "/settings/display/sidebar",
    label: i18n.t("Sidebar"),
    icon: PanelLeft,
  },
  {
    to: "/settings/display/bookmark-add",
    label: i18n.t("Bookmark Add Form"),
    icon: SquarePlus,
  },
  {
    to: "/settings/display/bookmark-graph",
    label: i18n.t("Bookmark Graph"),
    icon: Share2,
  },
  {
    to: "/settings/display/filters",
    label: i18n.t("Filters"),
    icon: Filter,
  },
  {
    to: "/settings/display/homepage",
    label: i18n.t("Homepage"),
    icon: LayoutTemplate,
  },
  {
    to: "/settings/display/languages",
    label: i18n.t("Languages"),
    icon: Languages,
  },
] as const;

export const mediaNav: readonly SettingsTabNavItem[] = [
  {
    to: "/settings/media/display",
    label: i18n.t("Display"),
    icon: Image,
  },
  {
    to: "/settings/media/manage",
    label: i18n.t("Manage Media"),
    icon: FolderOpen,
  },
  {
    to: "/settings/media/screenshot-defaults",
    label: i18n.t("Screenshot Defaults"),
    icon: Camera,
  },
] as const;

export const automationsNav: readonly SettingsTabNavItem[] = [
  {
    to: "/settings/automations/global",
    label: i18n.t("Global"),
    icon: Wand2,
  },
  {
    to: "/settings/automations/backfill",
    label: i18n.t("Backfill"),
    icon: History,
  },
  {
    to: "/settings/automations/link-parsing",
    label: i18n.t("Link Parsing"),
    icon: Link2,
  },
  {
    to: "/settings/automations/check-links",
    label: i18n.t("Check Links"),
    icon: ListChecks,
  },
  {
    to: "/settings/automations/redirect-failures",
    label: i18n.t("Redirect failures"),
    icon: Forward,
  },
  {
    to: "/settings/automations/imports",
    label: i18n.t("Imports"),
    icon: Inbox,
  },
] as const;

export const locationsNav: readonly SettingsTabNavItem[] = [
  {
    to: "/settings/locations/level-groups",
    label: i18n.t("Level Groups"),
    icon: MapPin,
  },
  {
    to: "/settings/locations/pin-style",
    label: i18n.t("Pin Style"),
    icon: MapPin,
  },
  {
    to: "/settings/locations/place-types",
    label: i18n.t("Place Types"),
    icon: MapPin,
  },
  {
    to: "/settings/locations/location-relations",
    label: i18n.t("Location Relations"),
    icon: Waypoints,
  },
] as const;

export const advancedNav: readonly SettingsTabNavItem[] = [
  {
    to: "/settings/advanced/connectors",
    label: i18n.t("Connectors"),
    icon: Cable,
  },
  {
    to: "/settings/advanced/manage-data",
    label: i18n.t("Manage Data"),
    icon: Database,
  },
  {
    to: "/settings/advanced/updates",
    label: i18n.t("Updates"),
    icon: RefreshCw,
  },
  {
    to: "/settings/advanced/database-usage",
    label: i18n.t("Database usage"),
    icon: HardDrive,
  },
] as const;

/** Every tabbed settings section with its favorite-label prefix, in settings-nav order. */
export const SETTINGS_TAB_SECTIONS = [
  {
    section: "Display",
    path: "/settings/display",
    items: displayNav,
  },
  {
    section: "Media",
    path: "/settings/media",
    items: mediaNav,
  },
  {
    section: "Automations",
    path: "/settings/automations",
    items: automationsNav,
  },
  {
    section: "Locations",
    path: "/settings/locations",
    items: locationsNav,
  },
  {
    section: "Advanced",
    path: "/settings/advanced",
    items: advancedNav,
  },
] as const;
