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
          <h1 className="text-2xl font-bold">Newsletters</h1>
          {allNewsletters
            ? (
              <Badge variant="secondary">
                {allNewsletters.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Browse the Newsletters taxonomy. Create a newsletter, set its default category, tags, and
          media type, then select it when importing a newsletter edition. Click a newsletter to browse
          its issues.
        </p>
      </div>

      <NewslettersListing />
    </section>
  );
}
