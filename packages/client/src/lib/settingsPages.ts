/**
 * Registry of pages that can be favorited as "Settings pages". This is the single source of truth
 * for **which** pages show the header star button and **what label** a favorited path renders with
 * in the sidebar Settings flyout. Only the `path` is persisted server-side (see
 * `FavoriteSettingsPage`); the label is resolved from here, so a favorited path no longer in this
 * list is simply skipped on render.
 *
 * Covers every `/settings/*` nav entry (mirrors `settingsNav` in `routes/settings.tsx`) plus the
 * management/customization listing pages that live at their own routes (mirrors `taxonomyItems` /
 * `customizationItems` in `components/app-sidebar.tsx`).
 */
export interface SettingsPage {
  path: string;
  label: string;
}

export const SETTINGS_PAGES: readonly SettingsPage[] = [
  // /settings/* sub-pages
  {
    path: "/settings/display",
    label: "Display",
  },
  {
    path: "/settings/sidebar",
    label: "Drawer",
  },
  {
    path: "/settings/saved-filters",
    label: "Saved Filters",
  },
  {
    path: "/settings/homepage",
    label: "Homepage",
  },
  {
    path: "/settings/card-display-rules",
    label: "Card Display Rules",
  },
  {
    path: "/settings/gallery",
    label: "Gallery",
  },
  {
    path: "/settings/automations",
    label: "Automations",
  },
  {
    path: "/settings/link-parsing",
    label: "Link Parsing",
  },
  {
    path: "/settings/more-categories",
    label: "Categories",
  },
  {
    path: "/settings/more-taxonomies",
    label: "Taxonomies",
  },
  {
    path: "/settings/more-customization",
    label: "Customization",
  },
  {
    path: "/settings/advanced",
    label: "Advanced",
  },
  // Management / customization pages outside the /settings/ route
  {
    path: "/categories",
    label: "Categories",
  },
  {
    path: "/tags",
    label: "Tags",
  },
  {
    path: "/taxonomies/websites",
    label: "Websites",
  },
  {
    path: "/taxonomies/media-types",
    label: "Media Types",
  },
  {
    path: "/taxonomies/youtube-channels",
    label: "YouTube Channels",
  },
  {
    path: "/taxonomies/property-groups",
    label: "Property Groups",
  },
  {
    path: "/taxonomies/relationship-types",
    label: "Relationship Types",
  },
  {
    path: "/custom-properties",
    label: "Custom Properties",
  },
  {
    path: "/autofill",
    label: "Autofill Rules",
  },
] as const;

/** The favoritable settings page for an exact pathname, or `undefined` if the page isn't one. */
export function findSettingsPage(pathname: string): SettingsPage | undefined {
  return SETTINGS_PAGES.find(page => page.path === pathname);
}
