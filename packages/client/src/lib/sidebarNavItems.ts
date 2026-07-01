import {
  Bookmark,
  Building2,
  Clapperboard,
  FileInput,
  FolderOpen,
  Globe,
  Home,
  Inbox,
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

/**
 * The app sidebar's nav-item data, extracted so registries can derive from it. The sidebar
 * (`components/app-sidebar.tsx`) renders these; `lib/settingsPages.ts` derives the favoritable
 * management pages from `taxonomyItems` / `actionItems` / `customizationItems`, so adding an entry
 * here automatically makes the page favoritable (star button + Settings favorites flyout) — no
 * separate registration.
 */

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: Home,
  },
  {
    title: "Inbox",
    to: "/inbox",
    icon: Inbox,
  },
  {
    title: "Bookmarks",
    to: "/bookmarks",
    icon: Bookmark,
  },
] as const;

export const taxonomyItems = [
  {
    key: "categories",
    title: "Categories",
    to: "/categories",
    icon: FolderOpen,
  },
  {
    key: "tags",
    title: "Tags",
    to: "/tags",
    icon: Tags,
  },
  {
    key: "websites",
    title: "Websites",
    to: "/taxonomies/websites",
    icon: Globe,
  },
  {
    key: "media-types",
    title: "Media Types",
    to: "/taxonomies/media-types",
    icon: Clapperboard,
  },
  {
    key: "locations",
    title: "Locations",
    to: "/taxonomies/locations",
    icon: MapPin,
  },
  {
    key: "youtube-channels",
    title: "YouTube Channels",
    to: "/taxonomies/youtube-channels",
    icon: MonitorPlay,
  },
  {
    key: "newsletters",
    title: "Imports",
    to: "/taxonomies/newsletters",
    icon: Mail,
  },
  {
    key: "authors",
    title: "Authors",
    to: "/taxonomies/authors",
    icon: UserRound,
  },
  {
    key: "publishers",
    title: "Publishers",
    to: "/taxonomies/publishers",
    icon: Building2,
  },
] as const;

export const actionItems = [
  {
    title: "AI Summarization",
    to: "/ai-summarization",
    icon: Sparkles,
  },
] as const;

export const customizationItems = [
  {
    key: "custom-properties",
    title: "Custom Properties",
    to: "/custom-properties",
    icon: SlidersHorizontal,
  },
  {
    key: "property-groups",
    title: "Property Groups",
    to: "/taxonomies/property-groups",
    icon: Layers,
  },
  {
    key: "relationship-types",
    title: "Relationship Types",
    to: "/taxonomies/relationship-types",
    icon: Share2,
  },
  {
    key: "autofill",
    title: "Autofill Rules",
    to: "/autofill",
    icon: Wand2,
  },
  {
    key: "card-display-rules",
    title: "Card Display Rules",
    to: "/card-display-rules",
    icon: LayoutGrid,
  },
  {
    key: "import-rules",
    title: "Import Rules",
    to: "/import-rules",
    icon: FileInput,
  },
  {
    key: "saved-filters",
    title: "Saved Filters",
    to: "/saved-filters",
    icon: ListFilter,
  },
] as const;
