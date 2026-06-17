import { createFileRoute } from "@tanstack/react-router";

import { TagManager } from "../components/TagManager";

export const Route = createFileRoute("/settings/tags")({
  component: TagsPage,
});

function TagsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Tags</h2>
        <p className="text-sm text-muted-foreground">
          Organize your taxonomy. Bookmarks can be assigned to any tier; filtering by a
          parent tag shows every bookmark in its subtree.
        </p>
      </div>
      <TagManager />
    </section>
  );
}
