import type { Person } from "@eesimple/types";

import { UserCircle } from "lucide-react";

import { EntityImagePreview } from "../EntityImageField";

import { useGroups } from "@/hooks/useGroups";
import { useWebsites } from "@/hooks/useWebsites";
import { useYouTubeChannels } from "@/hooks/useYouTubeChannels";
import { SOCIAL_MEDIA_PLATFORM_LABELS } from "@/lib/socialLinks";

export function PersonGeneralView({
  entity: person,
}: {
  entity: Person;
}) {
  const {
    data: channels,
  } = useYouTubeChannels();
  const {
    data: websites,
  } = useWebsites();
  const {
    data: groups,
  } = useGroups();

  const connectedChannels = (channels ?? []).filter(ch => person.youtubeChannelIds.includes(ch.id));
  const connectedWebsites = (websites ?? []).filter(site => person.websiteIds.includes(site.id));
  const connectedGroups = (groups ?? []).filter(pub => person.groupIds.includes(pub.id));

  return (
    <div className="space-y-3">
      <EntityImagePreview
        imageUrl={person.imageUrl}
        shape="circle"
        fallback={<UserCircle className="size-6" />}
      />
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Added</dt>
        <dd>{new Date(person.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{person.slug}</dd>
        {person.bookmarkCount != null
          ? (
            <>
              <dt className="text-muted-foreground">Bookmarks</dt>
              <dd>{person.bookmarkCount}</dd>
            </>
          )
          : null}
        {person.personWebsiteUrl != null
          ? (
            <>
              <dt className="text-muted-foreground">Website</dt>
              <dd>
                <a
                  href={person.personWebsiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {person.personWebsiteUrl}
                </a>
              </dd>
            </>
          )
          : null}
        {person.biographyUrl != null
          ? (
            <>
              <dt className="text-muted-foreground">Biography</dt>
              <dd>
                <a
                  href={person.biographyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {person.biographyUrl}
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
        {connectedGroups.map(pub => (
          <>
            <dt
              key={`pub-label-${pub.id}`}
              className="text-muted-foreground"
            >Group
            </dt>
            <dd key={`pub-value-${pub.id}`}>{pub.name}</dd>
          </>
        ))}
        {person.socialLinks.map(link => (
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
