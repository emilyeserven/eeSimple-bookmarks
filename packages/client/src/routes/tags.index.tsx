import { createFileRoute } from "@tanstack/react-router";

import { TagManager } from "../components/TagManager";
import { useTags } from "../hooks/useTags";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/tags/")({
  component: TagsListingPage,
});

/** Browse view for the Tags taxonomy: the full tag tree. Click a tag to view it, or add one. */
function TagsListingPage() {
  const {
    data: tags,
  } = useTags();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Tags</h1>
          {tags
            ? <Badge variant="secondary">{tags.length}</Badge>
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Browse the tag taxonomy. Click a tag to view it, or add a tag with “New tag”.
        </p>
      </div>

      <TagManager />
    </section>
  );
}
