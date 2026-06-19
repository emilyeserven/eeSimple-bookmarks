import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Clapperboard,
  FolderOpen,
  Globe,
  MonitorPlay,
  Tags,
} from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/settings/more-taxonomies")({
  component: MoreTaxonomiesPage,
});

const TAXONOMY_TILES = [
  {
    label: "Categories",
    description: "Organize bookmarks into named collections.",
    icon: FolderOpen,
    to: "/categories" as const,
  },
  {
    label: "Tags",
    description: "Apply freeform labels to bookmarks.",
    icon: Tags,
    to: "/tags" as const,
  },
  {
    label: "Websites",
    description: "View and rename the sites your bookmarks come from.",
    icon: Globe,
    to: "/taxonomies/websites" as const,
  },
  {
    label: "Media Types",
    description: "Classify bookmarks by the type of media they contain.",
    icon: Clapperboard,
    to: "/taxonomies/media-types" as const,
  },
  {
    label: "YouTube Channels",
    description: "Browse bookmarks grouped by their YouTube channel.",
    icon: MonitorPlay,
    to: "/taxonomies/youtube-channels" as const,
  },
] as const;

function MoreTaxonomiesPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Taxonomies</h2>
        <p className="text-sm text-muted-foreground">
          Browse and manage the ways bookmarks are organized and classified.
        </p>
      </div>

      <div
        className="
          grid grid-cols-1 gap-4
          sm:grid-cols-2
        "
      >
        {TAXONOMY_TILES.map(tile => (
          <Link
            key={tile.label}
            to={tile.to}
          >
            <Card className="
              cursor-pointer py-4 transition-colors
              hover:bg-accent
            ">
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
