import type { TabNavItem } from "../components/TabbedEntityLayout";
import type { LucideIcon } from "lucide-react";

import {
  Cable,
  Database,
  Filter,
  Forward,
  HardDrive,
  History,
  Image,
  Inbox,
  LayoutTemplate,
  Link2,
  ListChecks,
  MapPin,
  Monitor,
  PanelLeft,
  PanelRight,
  RefreshCw,
  Wand2,
} from "lucide-react";

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
    label: "General",
    icon: Monitor,
  },
  {
    to: "/settings/display/media",
    label: "Media",
    icon: Image,
  },
  {
    to: "/settings/display/sidebar",
    label: "Sidebar",
    icon: PanelLeft,
  },
  {
    to: "/settings/display/filters",
    label: "Filters",
    icon: Filter,
  },
  {
    to: "/settings/display/drawer",
    label: "Drawer",
    icon: PanelRight,
  },
  {
    to: "/settings/display/homepage",
    label: "Homepage",
    icon: LayoutTemplate,
  },
] as const;

export const automationsNav: readonly SettingsTabNavItem[] = [
  {
    to: "/settings/automations/global",
    label: "Global",
    icon: Wand2,
  },
  {
    to: "/settings/automations/backfill",
    label: "Backfill",
    icon: History,
  },
  {
    to: "/settings/automations/link-parsing",
    label: "Link Parsing",
    icon: Link2,
  },
  {
    to: "/settings/automations/check-links",
    label: "Check Links",
    icon: ListChecks,
  },
  {
    to: "/settings/automations/redirect-failures",
    label: "Redirect failures",
    icon: Forward,
  },
  {
    to: "/settings/automations/imports",
    label: "Imports",
    icon: Inbox,
  },
] as const;

export const locationsNav: readonly SettingsTabNavItem[] = [
  {
    to: "/settings/locations/level-groups",
    label: "Level Groups",
    icon: MapPin,
  },
  {
    to: "/settings/locations/pin-style",
    label: "Pin Style",
    icon: MapPin,
  },
  {
    to: "/settings/locations/place-types",
    label: "Place Types",
    icon: MapPin,
  },
] as const;

export const advancedNav: readonly SettingsTabNavItem[] = [
  {
    to: "/settings/advanced/connectors",
    label: "Connectors",
    icon: Cable,
  },
  {
    to: "/settings/advanced/manage-data",
    label: "Manage Data",
    icon: Database,
  },
  {
    to: "/settings/advanced/updates",
    label: "Updates",
    icon: RefreshCw,
  },
  {
    to: "/settings/advanced/database-usage",
    label: "Database usage",
    icon: HardDrive,
  },
  {
    to: "/settings/advanced/manage-media",
    label: "Manage Media",
    icon: Image,
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
