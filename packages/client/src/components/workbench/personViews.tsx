import type { Person } from "@eesimple/types";

import { UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EntityImagePreview } from "../EntityImageField";
import { EntityNamesTabView } from "../entityNames/EntityNamesTab";

import { useAlbums } from "@/hooks/useAlbums";
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
    t,
  } = useTranslation();
  const {
    data: channels,
  } = useYouTubeChannels();
  const {
    data: websites,
  } = useWebsites();
  const {
    data: groups,
  } = useGroups();
  const {
    data: albums,
  } = useAlbums();

  const connectedChannels = (channels ?? []).filter(ch => person.youtubeChannelIds.includes(ch.id));
  const connectedWebsites = (websites ?? []).filter(site => person.websiteIds.includes(site.id));
  const connectedGroups = (groups ?? []).filter(pub => person.groupIds.includes(pub.id));
  const creditedAlbums = (albums ?? []).filter(album => person.albumIds.includes(album.id));

  return (
    <div className="space-y-3">
      <EntityImagePreview
        imageUrl={person.imageUrl}
        shape="circle"
        fallback={<UserCircle className="size-6" />}
      />
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{t("Added")}</dt>
        <dd>{new Date(person.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">{t("Slug")}</dt>
        <dd className="font-mono">{person.slug}</dd>
        <dt className="text-muted-foreground">{t("Names")}</dt>
        <dd>
          <EntityNamesTabView
            ownerType="person"
            ownerId={person.id}
          />
        </dd>
        {person.bookmarkCount != null
          ? (
            <>
              <dt className="text-muted-foreground">{t("Bookmarks")}</dt>
              <dd>{person.bookmarkCount}</dd>
            </>
          )
          : null}
        {person.personWebsiteUrl != null
          ? (
            <>
              <dt className="text-muted-foreground">{t("Website")}</dt>
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
              <dt className="text-muted-foreground">{t("Biography")}</dt>
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
        {person.year != null
          ? (
            <>
              <dt className="text-muted-foreground">{t("Year")}</dt>
              <dd>{person.year}</dd>
            </>
          )
          : null}
        {person.plexItemTitle != null
          ? (
            <>
              <dt className="text-muted-foreground">{t("Plex")}</dt>
              <dd>{person.plexItemTitle}</dd>
            </>
          )
          : null}
        {creditedAlbums.length > 0
          ? (
            <>
              <dt className="text-muted-foreground">{t("Albums")}</dt>
              <dd>{creditedAlbums.map(album => album.name).join(", ")}</dd>
            </>
          )
          : null}
        {connectedChannels.map(ch => (
          <>
            <dt
              key={`ch-label-${ch.id}`}
              className="text-muted-foreground"
            >{t("YouTube Channel")}
            </dt>
            <dd key={`ch-value-${ch.id}`}>{ch.name}</dd>
          </>
        ))}
        {connectedWebsites.map(site => (
          <>
            <dt
              key={`site-label-${site.id}`}
              className="text-muted-foreground"
            >{t("Website")}
            </dt>
            <dd key={`site-value-${site.id}`}>{site.siteName}</dd>
          </>
        ))}
        {connectedGroups.map(pub => (
          <>
            <dt
              key={`pub-label-${pub.id}`}
              className="text-muted-foreground"
            >{t("Group")}
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
