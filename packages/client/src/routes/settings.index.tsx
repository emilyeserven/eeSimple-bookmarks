import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Monitor,
  Puzzle,
  Sparkles,
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
    label: "Automations",
    description: "Auto-behaviors, link parsing, redirect failures, and imports.",
    icon: Wand2,
    to: "/settings/automations" as const,
  },
  {
    label: "AI Summarization",
    description: "Store a summarization prompt and mark queued bookmarks as summarized.",
    icon: Sparkles,
    to: "/ai-summarization" as const,
  },
  {
    label: "Extension",
    description: "Install a bookmarklet to save the current page.",
    icon: Puzzle,
    to: "/settings/extension" as const,
  },
  {
    label: "Advanced",
    description: "Connectors, data cleanup, app updates, database usage, and stored media.",
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
