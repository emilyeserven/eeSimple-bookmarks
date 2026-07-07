import {
  Bookmark,
  Building2,
  Clapperboard,
  Drama,
  FileInput,
  FolderOpen,
  Globe,
  Home,
  Inbox,
  Languages,
  Layers,
  LayoutGrid,
  ListFilter,
  Mail,
  MapPin,
  MonitorPlay,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Tags,
  UserRound,
  Wand2,
} from "lucide-react";

import i18n from "../i18n";

/**
 * The app sidebar's nav-item data, extracted so registries can derive from it. The sidebar
 * (`components/app-sidebar.tsx`) renders these; `lib/settingsPages.ts` derives the favoritable
 * management pages from `taxonomyItems` / `actionItems` / `customizationItems`, so adding an entry
 * here automatically makes the page favoritable (star button + Settings favorites flyout) — no
 * separate registration.
 */

export const navItems = [
  {
    title: i18n.t("Home"),
    to: "/",
    icon: Home,
  },
  {
    title: i18n.t("Inbox"),
    to: "/inbox",
    icon: Inbox,
  },
  {
    title: i18n.t("Bookmarks"),
    to: "/bookmarks",
    icon: Bookmark,
  },
] as const;

export const taxonomyItems = [
  {
    key: "categories",
    title: i18n.t("Categories"),
    to: "/categories",
    icon: FolderOpen,
  },
  {
    key: "tags",
    title: i18n.t("Tags"),
    to: "/tags",
    icon: Tags,
  },
  {
    key: "websites",
    title: i18n.t("Websites"),
    to: "/taxonomies/websites",
    icon: Globe,
  },
  {
    key: "media-types",
    title: i18n.t("Media Types"),
    to: "/taxonomies/media-types",
    icon: Clapperboard,
  },
  {
    key: "genres-moods",
    title: i18n.t("Genres & Moods"),
    to: "/taxonomies/genres-moods",
    icon: Drama,
  },
  {
    key: "languages",
    title: i18n.t("Languages"),
    to: "/taxonomies/languages",
    icon: Languages,
  },
  {
    key: "locations",
    title: i18n.t("Locations"),
    to: "/taxonomies/locations",
    icon: MapPin,
  },
  {
    key: "youtube-channels",
    title: i18n.t("YouTube Channels"),
    to: "/taxonomies/youtube-channels",
    icon: MonitorPlay,
  },
  {
    key: "newsletters",
    title: i18n.t("Imports"),
    to: "/taxonomies/newsletters",
    icon: Mail,
  },
  {
    key: "people",
    title: i18n.t("People"),
    to: "/taxonomies/people",
    icon: UserRound,
  },
  {
    key: "groups",
    title: i18n.t("Groups"),
    to: "/taxonomies/groups",
    icon: Building2,
  },
] as const;

export const actionItems = [
  {
    title: i18n.t("AI Summarization"),
    to: "/ai-summarization",
    icon: Sparkles,
  },
] as const;

export const customizationItems = [
  {
    key: "custom-properties",
    title: i18n.t("Custom Properties"),
    to: "/custom-properties",
    icon: SlidersHorizontal,
  },
  {
    key: "property-groups",
    title: i18n.t("Property Groups"),
    to: "/taxonomies/property-groups",
    icon: Layers,
  },
  {
    key: "relationship-types",
    title: i18n.t("Relationship Types"),
    to: "/taxonomies/relationship-types",
    icon: Share2,
  },
  {
    key: "autofill",
    title: i18n.t("Autofill Rules"),
    to: "/autofill",
    icon: Wand2,
  },
  {
    key: "card-display-rules",
    title: i18n.t("Card Display Rules"),
    to: "/card-display-rules",
    icon: LayoutGrid,
  },
  {
    key: "import-rules",
    title: i18n.t("Import Rules"),
    to: "/import-rules",
    icon: FileInput,
  },
  {
    key: "saved-filters",
    title: i18n.t("Saved Filters"),
    to: "/saved-filters",
    icon: ListFilter,
  },
] as const;
