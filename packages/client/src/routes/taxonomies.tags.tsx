import { Link, createFileRoute } from "@tanstack/react-router";

import { TagManager } from "../components/TagManager";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/tags")({
  component: TagsTaxonomyPage,
});

/** Browse view for the Tags taxonomy: the full tag tree, with links to add a tag and to Settings. */
function TagsTaxonomyPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Tags</h1>
          <p className="text-sm text-muted-foreground">
            Browse the tag taxonomy. Add a tag with “New tag”, or open Settings to manage it in detail.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link to="/settings/tags">Settings</Link>
        </Button>
      </div>

      <TagManager />
    </section>
  );
}
