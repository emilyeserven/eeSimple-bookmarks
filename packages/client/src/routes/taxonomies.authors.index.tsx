import { createFileRoute } from "@tanstack/react-router";

import { AuthorsListing } from "../components/AuthorManager";
import { useAuthors } from "../hooks/useAuthors";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/authors/")({
  component: AuthorsTaxonomyPage,
});

/** Browse view for the Authors taxonomy: every author with search filtering. */
function AuthorsTaxonomyPage() {
  const {
    data: allAuthors,
  } = useAuthors();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Authors</h1>
          {allAuthors
            ? (
              <Badge variant="secondary">
                {allAuthors.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Browse the Authors taxonomy. Create an author, then assign them to bookmarks.
        </p>
      </div>

      <AuthorsListing />
    </section>
  );
}
