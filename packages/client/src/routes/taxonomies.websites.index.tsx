import { createFileRoute } from "@tanstack/react-router";

import { useWebsites } from "../hooks/useWebsites";
import { WebsitesListing } from "../components/WebsiteManager";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/websites/")({
  component: WebsitesTaxonomyPage,
});

/** Browse view for the Websites taxonomy: every known site with search filtering. */
function WebsitesTaxonomyPage() {
  const { data: allWebsites } = useWebsites();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Websites</h1>
          {allWebsites
            ? (
              <Badge variant="secondary">
                {allWebsites.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Browse the Websites taxonomy. Sites are created automatically when you add bookmarks. Click
          a site to view or edit it.
        </p>
      </div>

      <WebsitesListing />
    </section>
  );
}
