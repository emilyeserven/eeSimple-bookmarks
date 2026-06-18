import { createFileRoute } from "@tanstack/react-router";

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
        website.shortenedLinks.length === 0
          ? <p className="text-sm text-muted-foreground">None configured.</p>
          : (
            <ul className="space-y-2 text-sm">
              {website.shortenedLinks.map(link => (
                <li
                  key={link.domain}
                  className="rounded-md border p-2"
                >
                  <span className="font-mono">{link.domain}</span>
                  {link.keepShortened || !link.expandTo
                    ? <span className="text-muted-foreground"> — kept shortened</span>
                    : (
                      <>
                        <span className="text-muted-foreground"> → </span>
                        <span className="font-mono">{link.expandTo}</span>
                      </>
                    )}
                </li>
              ))}
            </ul>
          )
      )}
    </WebsiteTabWrapper>
  );
}
