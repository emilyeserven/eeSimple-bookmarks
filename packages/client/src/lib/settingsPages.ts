import type { LucideIcon } from "lucide-react";

import {
  Bookmark,
  Clapperboard,
  Filter,
  FolderOpen,
  Globe,
  Image,
  Inbox,
  Layers,
  LayoutGrid,
  LayoutTemplate,
  Link2,
  Monitor,
  MonitorPlay,
  PanelRight,
  Puzzle,
  Share2,
  SlidersHorizontal,
  Tags,
  Wand2,
  Wrench,
} from "lucide-react";

/**
 * Registry of pages that can be favorited as "Settings pages". This is the single source of truth
 * for **which** pages show the header star button, **what label** a favorited path renders with,
 * and **which icon** it shows in the sidebar Settings flyout. Only the `path` is persisted
 * server-side (see `FavoriteSettingsPage`); the label and icon are resolved from here, so a
 * favorited path no longer in this list is simply skipped on render.
 *
 * Covers every `/settings/*` nav entry (mirrors `settingsNav` in `routes/settings.tsx`) plus the
 * management/customization listing pages that live at their own routes (mirrors `taxonomyItems` /
 * `customizationItems` in `components/app-sidebar.tsx`). Icons mirror those surfaces too —
 * `SETTINGS_TILES` in `routes/settings.index.tsx` for the `/settings/*` pages and the sidebar
 * `taxonomyItems` / `customizationItems` icons for the listing pages outside `/settings`.
 */
export interface SettingsPage {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const SETTINGS_PAGES: readonly SettingsPage[] = [
  // /settings/* sub-pages
  {
    path: "/settings/display",
    label: "Display",
    icon: Monitor,
  },
  {
    path: "/settings/sidebar",
    label: "Drawer",
    icon: PanelRight,
  },
  {
    path: "/settings/saved-filters",
    label: "Saved Filters",
    icon: Filter,
  },
  {
    path: "/settings/homepage",
    label: "Homepage",
    icon: LayoutTemplate,
  },
  {
    path: "/card-display-rules",
    label: "Card Display Rules",
    icon: LayoutGrid,
  },
  {
    path: "/settings/media-management",
    label: "Media Management",
    icon: Image,
  },
  {
    path: "/settings/automations",
    label: "Automations",
    icon: Wand2,
  },
  {
    path: "/settings/link-parsing",
    label: "Link Parsing",
    icon: Link2,
  },
  {
    path: "/settings/imports",
    label: "Import Settings",
    icon: Inbox,
  },
  {
    path: "/settings/extension",
    label: "Extension",
    icon: Puzzle,
  },
  {
    path: "/settings/more-categories",
    label: "Categories",
    icon: Bookmark,
  },
  {
    path: "/settings/more-taxonomies",
    label: "Taxonomies",
    icon: Tags,
  },
  {
    path: "/settings/more-customization",
    label: "Customization",
    icon: SlidersHorizontal,
  },
  {
    path: "/settings/advanced",
    label: "Advanced",
    icon: Wrench,
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
