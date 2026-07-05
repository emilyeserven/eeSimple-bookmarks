import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { WebsitesListing } from "../components/WebsiteManager";
import { useWebsites } from "../hooks/useWebsites";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/websites/")({
  component: WebsitesTaxonomyPage,
});

/** Browse view for the Websites taxonomy: every known site with search filtering. */
function WebsitesTaxonomyPage() {
  const {
    t,
  } = useTranslation();
  const {
    data: allWebsites,
  } = useWebsites();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{t("Websites")}</h1>
          {allWebsites
            ? (
              <Badge variant="secondary">
                {allWebsites.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {t(
            "Browse the Websites taxonomy. Sites are created automatically when you add bookmarks. Click a site to view or edit it.",
          )}
        </p>
      </div>

      <WebsitesListing />
    </section>
  );
}
