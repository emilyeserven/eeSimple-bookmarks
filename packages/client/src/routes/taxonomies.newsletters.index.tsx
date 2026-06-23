import { createFileRoute } from "@tanstack/react-router";

import { NewslettersListing } from "../components/NewsletterManager";
import { useNewsletters } from "../hooks/useNewsletters";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/newsletters/")({
  component: NewslettersTaxonomyPage,
});

/** Browse view for the Newsletters taxonomy: every newsletter with search filtering. */
function NewslettersTaxonomyPage() {
  const {
    data: allNewsletters,
  } = useNewsletters();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Imports</h1>
          {allNewsletters
            ? (
              <Badge variant="secondary">
                {allNewsletters.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Browse the Imports taxonomy. Create an import, set its default category, tags, and media
          type, then select it when adding an import. Click an import to browse its import groups.
        </p>
      </div>

      <NewslettersListing />
    </section>
  );
}
