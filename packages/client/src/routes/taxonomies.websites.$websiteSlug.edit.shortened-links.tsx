import { createFileRoute } from "@tanstack/react-router";

import { WebsiteShortenedLinksForm } from "../components/WebsiteShortenedLinksForm";
import { WebsiteTabWrapper } from "../components/WebsiteTabWrapper";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/edit/shortened-links")({
  component: ShortenedLinksEditTab,
});

function ShortenedLinksEditTab() {
  const {
    websiteSlug,
  } = Route.useParams();
  return (
    <WebsiteTabWrapper
      websiteSlug={websiteSlug}
      title="Shortened Links"
      description="Short domains that resolve to this site and how they expand."
    >
      {website => <WebsiteShortenedLinksForm website={website} />}
    </WebsiteTabWrapper>
  );
}
