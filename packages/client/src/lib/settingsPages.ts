import type { LucideIcon } from "lucide-react";

import {
  Cable,
  Clapperboard,
  Database,
  Filter,
  FolderOpen,
  Forward,
  Globe,
  HardDrive,
  History,
  Image,
  Inbox,
  Layers,
  LayoutGrid,
  LayoutTemplate,
  Link2,
  ListChecks,
  Monitor,
  MonitorPlay,
  PanelLeft,
  PanelRight,
  Puzzle,
  RefreshCw,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Tags,
  Wand2,
} from "lucide-react";

/**
 * Registry of pages that can be favorited as "Settings pages". This is the single source of truth
 * for **which** pages show the header star button, **what label** a favorited path renders with,
 * and **which icon** it shows in the sidebar Settings flyout. Only the `path` is persisted
 * server-side (see `FavoriteSettingsPage`); the label and icon are resolved from here, so a
 * favorited path no longer in this list is simply skipped on render.
 *
 * Covers every `/settings/*` nav entry (mirrors `settingsNav` in `routes/settings.tsx`) — including
 * the nested **tab pages** inside the tabbed sections (the `*Nav` arrays in `settings.display.tsx`,
 * `settings.automations.tsx`, `settings.advanced.tsx`); register each tab's leaf path here so it gets
 * a header star. Don't register the section parents (`/settings/display` / `/settings/automations` /
 * `/settings/advanced`): their index routes redirect to the first tab, so the parent path is never
 * the live pathname and an entry for it can never match. Plus the management/customization listing
 * pages that live at their own routes (mirrors `taxonomyItems` / `customizationItems` in
 * `components/app-sidebar.tsx`). Icons mirror those surfaces too — `SETTINGS_TILES` in
 * `routes/settings.index.tsx` for the `/settings/*` pages and the sidebar `taxonomyItems` /
 * `customizationItems` icons for the listing pages outside `/settings`.
 */
export interface SettingsPage {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const SETTINGS_PAGES: readonly SettingsPage[] = [
  // /settings/* sub-pages
  {
    path: "/settings/display/general",
    label: "Display: General",
    icon: Monitor,
  },
  {
    path: "/settings/display/media",
    label: "Display: Media",
    icon: Image,
  },
  {
    path: "/settings/display/sidebar",
    label: "Display: Sidebar",
    icon: PanelLeft,
  },
  {
    path: "/settings/display/filters",
    label: "Display: Filters",
    icon: Filter,
  },
  {
    path: "/settings/display/drawer",
    label: "Display: Drawer",
    icon: PanelRight,
  },
  {
    path: "/settings/display/homepage",
    label: "Display: Homepage",
    icon: LayoutTemplate,
  },
  {
    path: "/card-display-rules",
    label: "Card Display Rules",
    icon: LayoutGrid,
  },
  {
    path: "/settings/advanced/manage-media",
    label: "Manage Media",
    icon: Image,
  },
  {
    path: "/settings/automations/global",
    label: "Automations: Global",
    icon: Wand2,
  },
  {
    path: "/settings/automations/backfill",
    label: "Automations: Backfill",
    icon: History,
  },
  {
    path: "/ai-summarization",
    label: "AI Summarization",
    icon: Sparkles,
  },
  {
    path: "/settings/automations/link-parsing",
    label: "Link Parsing",
    icon: Link2,
  },
  {
    path: "/settings/automations/check-links",
    label: "Check Links",
    icon: ListChecks,
  },
  {
    path: "/settings/automations/redirect-failures",
    label: "Redirect Failures",
    icon: Forward,
  },
  {
    path: "/settings/automations/imports",
    label: "Imports",
    icon: Inbox,
  },
  {
    path: "/settings/extension",
    label: "Extension",
    icon: Puzzle,
  },
  {
    path: "/settings/advanced/connectors",
    label: "Connectors",
    icon: Cable,
  },
  {
    path: "/settings/advanced/manage-data",
    label: "Manage Data",
    icon: Database,
  },
  {
    path: "/settings/advanced/updates",
    label: "Updates",
    icon: RefreshCw,
  },
  {
    path: "/settings/advanced/database-usage",
    label: "Database Usage",
    icon: HardDrive,
  },
  // Management / customization pages outside the /settings/ route
  {
    path: "/categories",
    label: "Categories",
    icon: FolderOpen,
  },
  {
    path: "/tags",
    label: "Tags",
    icon: Tags,
  },
  {
    path: "/taxonomies/websites",
    label: "Websites",
    icon: Globe,
  },
  {
    path: "/taxonomies/media-types",
    label: "Media Types",
    icon: Clapperboard,
  },
  {
    path: "/taxonomies/youtube-channels",
    label: "YouTube Channels",
    icon: MonitorPlay,
  },
  {
    path: "/taxonomies/property-groups",
    label: "Property Groups",
    icon: Layers,
  },
  {
    path: "/taxonomies/relationship-types",
    label: "Relationship Types",
    icon: Share2,
  },
  {
    path: "/custom-properties",
    label: "Custom Properties",
    icon: SlidersHorizontal,
  },
  {
    path: "/autofill",
    label: "Autofill Rules",
    icon: Wand2,
  },
] as const;

/** The favoritable settings page for an exact pathname, or `undefined` if the page isn't one. */
export function findSettingsPage(pathname: string): SettingsPage | undefined {
  return SETTINGS_PAGES.find(page => page.path === pathname);
}
