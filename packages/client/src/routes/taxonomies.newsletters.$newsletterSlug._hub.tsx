import { Link, createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { useNewsletterBySlug } from "../hooks/useNewsletters";

/**
 * Newsletter (import source) shell: the entity header over an `Issues | Info` strip. Newsletters are the
 * bespoke listing entity — their "listing" is the import-group **Issues** list rather than a
 * bookmarks/gallery/media set — so the strip has just those two tabs. `edit` sits outside this layout.
 */
export const Route = createFileRoute("/taxonomies/newsletters/$newsletterSlug/_hub")({
  component: NewsletterHubLayout,
});

function NewsletterHubLayout() {
  const {
    t,
  } = useTranslation();
  const {
    newsletterSlug,
  } = Route.useParams();
  const {
    newsletter, isLoading,
  } = useNewsletterBySlug(newsletterSlug);

  return (
    <ListingHubLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/newsletters"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to imports")}
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Mail className="size-6 shrink-0" />
            {isLoading ? t("Newsletter") : (newsletter?.name ?? t("Newsletter not found"))}
          </h1>
        </div>
      )}
      tabs={[
        {
          to: "/taxonomies/newsletters/$newsletterSlug",
          label: t("Issues"),
          exact: true,
        },
        {
          to: "/taxonomies/newsletters/$newsletterSlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        newsletterSlug,
      }}
      navAriaLabel={t("Newsletter views")}
    />
  );
}
