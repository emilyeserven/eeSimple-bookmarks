import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bookmark,
  Filter,
  Image,
  Inbox,
  LayoutTemplate,
  Link2,
  Link2Off,
  Monitor,
  PanelRight,
  Puzzle,
  SlidersHorizontal,
  Sparkles,
  Tags,
  Wand2,
  Wrench,
} from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SETTINGS_TILES = [
  {
    label: "Display",
    description: "Personalize how the app looks.",
    icon: Monitor,
    to: "/settings/display" as const,
  },
  {
    label: "Drawer",
    description: "Control how the right-hand drawer opens.",
    icon: PanelRight,
    to: "/settings/sidebar" as const,
  },
  {
    label: "Saved Filters",
    description: "Manage your saved bookmark filters.",
    icon: Filter,
    to: "/settings/saved-filters" as const,
  },
  {
    label: "Homepage",
    description: "Configure the homepage sections and layout.",
    icon: LayoutTemplate,
    to: "/settings/homepage" as const,
  },
  {
    label: "Media Management",
    description: "Manage every image stored for your bookmarks.",
    icon: Image,
    to: "/settings/media-management" as const,
  },
  {
    label: "Automations",
    description: "Configure automatic behaviors when saving bookmarks.",
    icon: Wand2,
    to: "/settings/automations" as const,
  },
  {
    label: "AI Summarization",
    description: "Store a summarization prompt and mark queued bookmarks as summarized.",
    icon: Sparkles,
    to: "/settings/ai-summarization" as const,
  },
  {
    label: "Link Parsing",
    description: "Configure URL parsing and link shorteners.",
    icon: Link2,
    to: "/settings/link-parsing" as const,
  },
  {
    label: "Redirect Failures",
    description: "Fix bookmarks from sites with unreliable redirect resolution.",
    icon: Link2Off,
    to: "/settings/redirect-failures" as const,
  },
  {
    label: "Import Settings",
    description: "Manage the imports blacklist and clear processed inbox items.",
    icon: Inbox,
    to: "/settings/imports" as const,
  },
  {
    label: "Extension",
    description: "Install a bookmarklet to save the current page.",
    icon: Puzzle,
    to: "/settings/extension" as const,
  },
  {
    label: "Categories",
    description: "Browse and manage bookmark categories.",
    icon: Bookmark,
    to: "/settings/more-categories" as const,
  },
  {
    label: "Taxonomies",
    description: "Manage tags, websites, media types, and channels.",
    icon: Tags,
    to: "/settings/more-taxonomies" as const,
  },
  {
    label: "Customization",
    description: "Custom properties, groups, relationships, and autofill.",
    icon: SlidersHorizontal,
    to: "/settings/more-customization" as const,
  },
  {
    label: "Advanced",
    description: "Opt-in sidebar links to Coolify, the docs, and Storybook.",
    icon: Wrench,
    to: "/settings/advanced" as const,
  },
] as const;

export const Route = createFileRoute("/settings/")({
  component: SettingsIndexPage,
});

function SettingsIndexPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Choose a section to manage your preferences.
        </p>
      </div>

      <div
        className="
          grid grid-cols-1 gap-4
          sm:grid-cols-2
        "
      >
        {SETTINGS_TILES.map(tile => (
          <Link
            key={tile.label}
            to={tile.to}
          >
            <Card
              className="
                cursor-pointer py-4 transition-colors
                hover:bg-accent
              "
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <tile.icon className="size-4 shrink-0" />
                  {tile.label}
                </CardTitle>
                <CardDescription>{tile.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
