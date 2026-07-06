import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useWebsiteBySlug } from "../hooks/useWebsites";

import { Badge } from "@/components/ui/badge";

/**
 * The website listing shell: the entity header over the `Bookmarks | Gallery | Media | Info` strip,
 * shared by the bookmarks/gallery/media panes and the Info page. `edit` is a sibling of this pathless
 * layout, so the strip never shows while editing.
 */
export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/_hub")({
  component: WebsiteHubLayout,
});

function WebsiteHubLayout() {
  const {
    t,
  } = useTranslation();
  const {
    websiteSlug,
  } = Route.useParams();
  const {
    website, isLoading,
  } = useWebsiteBySlug(websiteSlug);

  return (
    <ListingHubLayout
      header={(
        <TaxonomyViewHeader
          image={{
            kind: "url",
            url: website?.imageUrl ?? null,
          }}
          title={(
            <>
              {isLoading ? t("Website") : (website?.siteName ?? t("Website not found"))}
              {website?.builtIn ? <Badge variant="secondary">{t("Built-in")}</Badge> : null}
            </>
          )}
        />
      )}
      tabs={[
        {
          to: "/taxonomies/websites/$websiteSlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/taxonomies/websites/$websiteSlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/taxonomies/websites/$websiteSlug/media",
          label: t("Media"),
        },
        {
          to: "/taxonomies/websites/$websiteSlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        websiteSlug,
      }}
      navAriaLabel={t("Website views")}
    />
  );
}
