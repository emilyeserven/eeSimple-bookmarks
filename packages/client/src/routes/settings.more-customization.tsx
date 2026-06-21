import { createFileRoute, Link } from "@tanstack/react-router";
import { Layers, Share2, SlidersHorizontal, Wand2 } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/settings/more-customization")({
  component: MoreCustomizationPage,
});

const CUSTOMIZATION_TILES = [
  {
    label: "Custom Properties",
    description: "Define extra fields that can be attached to bookmarks.",
    icon: SlidersHorizontal,
    to: "/custom-properties" as const,
  },
  {
    label: "Property Groups",
    description: "Group related custom properties together.",
    icon: Layers,
    to: "/taxonomies/property-groups" as const,
  },
  {
    label: "Relationship Types",
    description: "Classify how bookmarks relate (Similar, Parent/child, Opposite, …).",
    icon: Share2,
    to: "/taxonomies/relationship-types" as const,
  },
  {
    label: "Autofill Rules",
    description: "Automatically populate bookmark fields based on conditions.",
    icon: Wand2,
    to: "/autofill" as const,
  },
] as const;

function MoreCustomizationPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Customization</h2>
        <p className="text-sm text-muted-foreground">
          Manage the tools that customize how bookmarks are structured and filled in.
        </p>
      </div>

      <div
        className="
          grid grid-cols-1 gap-4
          sm:grid-cols-2
        "
      >
        {CUSTOMIZATION_TILES.map(tile => (
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
