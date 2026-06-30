import type { Author } from "@eesimple/types";

import { UserCircle } from "lucide-react";

import { EntityImagePreview } from "../EntityImageField";

import { usePublishers } from "@/hooks/usePublishers";
import { useWebsites } from "@/hooks/useWebsites";
import { useYouTubeChannels } from "@/hooks/useYouTubeChannels";
import { SOCIAL_MEDIA_PLATFORM_LABELS } from "@/lib/socialLinks";

export function AuthorGeneralView({
  entity: author,
}: {
  entity: Author;
}) {
  const {
    data: channels,
  } = useYouTubeChannels();
  const {
    data: websites,
  } = useWebsites();
  const {
    data: publishers,
  } = usePublishers();

  const connectedChannels = (channels ?? []).filter(ch => author.youtubeChannelIds.includes(ch.id));
  const connectedWebsites = (websites ?? []).filter(site => author.websiteIds.includes(site.id));
  const connectedPublishers = (publishers ?? []).filter(pub => author.publisherIds.includes(pub.id));

  return (
    <div className="space-y-3">
      <EntityImagePreview
        imageUrl={author.imageUrl}
        shape="circle"
        fallback={<UserCircle className="size-6" />}
      />
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Added</dt>
        <dd>{new Date(author.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{author.slug}</dd>
        {author.bookmarkCount != null
          ? (
            <>
              <dt className="text-muted-foreground">Bookmarks</dt>
              <dd>{author.bookmarkCount}</dd>
            </>
          )
          : null}
        {author.authorWebsiteUrl != null
          ? (
            <>
              <dt className="text-muted-foreground">Website</dt>
              <dd>
                <a
                  href={author.authorWebsiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {author.authorWebsiteUrl}
                </a>
              </dd>
            </>
          )
          : null}
        {author.biographyUrl != null
          ? (
            <>
              <dt className="text-muted-foreground">Biography</dt>
              <dd>
                <a
                  href={author.biographyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {author.biographyUrl}
                </a>
              </dd>
            </>
          )
          : null}
        {connectedChannels.map(ch => (
          <>
            <dt
              key={`ch-label-${ch.id}`}
              className="text-muted-foreground"
            >YouTube Channel
            </dt>
            <dd key={`ch-value-${ch.id}`}>{ch.name}</dd>
          </>
        ))}
        {connectedWebsites.map(site => (
          <>
            <dt
              key={`site-label-${site.id}`}
              className="text-muted-foreground"
            >Website
            </dt>
            <dd key={`site-value-${site.id}`}>{site.siteName}</dd>
          </>
        ))}
        {connectedPublishers.map(pub => (
          <>
            <dt
              key={`pub-label-${pub.id}`}
              className="text-muted-foreground"
            >Publisher
            </dt>
            <dd key={`pub-value-${pub.id}`}>{pub.name}</dd>
          </>
        ))}
        {author.socialLinks.map(link => (
          <>
            <dt
              key={`${link.platform}-label`}
              className="text-muted-foreground"
            >
              {SOCIAL_MEDIA_PLATFORM_LABELS[link.platform]}
            </dt>
            <dd key={`${link.platform}-value`}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {link.url}
              </a>
            </dd>
          </>
        ))}
      </dl>
    </div>
  );
}
