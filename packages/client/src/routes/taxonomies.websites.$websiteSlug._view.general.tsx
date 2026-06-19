import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Globe } from "lucide-react";

import { EntityImagePreview } from "../components/EntityImageField";
import { SourceAutofillDefaults } from "../components/SourceAutofillDefaults";
import { WebsiteTabWrapper } from "../components/WebsiteTabWrapper";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/_view/general")({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    websiteSlug,
  } = Route.useParams();
  return (
    <WebsiteTabWrapper
      websiteSlug={websiteSlug}
      title="General"
      description="Domain, creation date, and metadata."
    >
      {website => (
        <div className="space-y-4">
          <EntityImagePreview
            imageUrl={website.imageUrl}
            shape="square"
            fallback={<Globe className="size-5" />}
          />
          <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Domain</dt>
            <dd>
              <a
                href={`https://${website.domain}`}
                target="_blank"
                rel="noreferrer"
                className="
                  inline-flex items-center gap-1 text-muted-foreground
                  hover:text-foreground hover:underline
                "
              >
                {website.domain}
                <ExternalLink className="size-3" />
              </a>
            </dd>
            <dt className="text-muted-foreground">Added</dt>
            <dd>{new Date(website.createdAt).toLocaleDateString()}</dd>
            <dt className="text-muted-foreground">Slug</dt>
            <dd className="font-mono">{website.slug}</dd>
            <dt className="text-muted-foreground">Built-in</dt>
            <dd>{website.builtIn ? "Yes — name & domain are fixed" : "No"}</dd>
            {website.bookmarkCount != null
              ? (
                <>
                  <dt className="text-muted-foreground">Bookmarks</dt>
                  <dd>{website.bookmarkCount}</dd>
                </>
              )
              : null}
          </dl>
          <SourceAutofillDefaults
            kind="website"
            category={website.category}
            tagIds={website.tagIds}
          />
        </div>
      )}
    </WebsiteTabWrapper>
  );
}
