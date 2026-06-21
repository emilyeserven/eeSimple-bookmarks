import { createFileRoute } from "@tanstack/react-router";

import { ShortenedLinksList } from "../components/ShortenedLinksList";
import { WebsiteTabWrapper } from "../components/WebsiteTabWrapper";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/_view/shortened-links")({
  component: ShortenedLinksViewTab,
});

function ShortenedLinksViewTab() {
  const {
    websiteSlug,
  } = Route.useParams();
  return (
    <WebsiteTabWrapper
      websiteSlug={websiteSlug}
      title="Shortened Links"
      description="Short domains that resolve to this site and how they expand."
    >
      {website => (
        <ShortenedLinksList
          links={website.shortenedLinks}
          emptyText="None configured."
        />
      )}
    </WebsiteTabWrapper>
  );
}
