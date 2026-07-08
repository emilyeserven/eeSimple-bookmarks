import type { Person } from "@eesimple/types";

import { UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EntityImagePreview } from "../EntityImageField";
import { EntityNamesTabView, PrimaryLanguageTabView } from "../entityNames/EntityNamesTab";

import { DetailField } from "@/components/DetailField";
import { useGroups } from "@/hooks/useGroups";
import { useWebsites } from "@/hooks/useWebsites";
import { useYouTubeChannels } from "@/hooks/useYouTubeChannels";
import { SOCIAL_MEDIA_PLATFORM_LABELS } from "@/lib/socialLinks";

/**
 * The read-only person **view** field components for the field registry (`workbench/person.tsx`, #1194
 * composite extraction). Each is a self-contained component — `LayoutDrivenTabBody` invokes a field's
 * `view` renderer as a plain call, so every hook must live inside a mounted component (isolated fiber).
 * Together these reproduce the single `<dl>` the old `PersonGeneralView` rendered, now split into
 * independently-placeable rows; each returns `null`/self-hides when empty so the layout seam's
 * `space-y-6` stack adds no gap for a field with nothing to show.
 */

interface Props {
  entity: Person;
}

/** Avatar preview (circle, `UserCircle` fallback). */
export function PersonAvatarView({
  entity: person,
}: Props) {
  return (
    <EntityImagePreview
      imageUrl={person.imageUrl}
      shape="circle"
      fallback={<UserCircle className="size-6" />}
    />
  );
}

/** Added / Slug / Bookmarks metadata rows (view-only — no editable counterpart). */
export function PersonMetadataView({
  entity: person,
}: Props) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2">
      <DetailField label={t("Added")}>
        {new Date(person.createdAt).toLocaleDateString()}
      </DetailField>
      <DetailField label={t("Slug")}>
        <span className="font-mono">{person.slug}</span>
      </DetailField>
      {person.bookmarkCount != null
        ? <DetailField label={t("Bookmarks")}>{person.bookmarkCount}</DetailField>
        : null}
    </div>
  );
}

/** Description row. */
export function PersonDescriptionView({
  entity: person,
}: Props) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Description")}>
      {person.description ?? null}
    </DetailField>
  );
}

/** Primary language block (standalone, mirrors the Category view). */
export function PersonPrimaryLanguageView({
  entity: person,
}: Props) {
  return (
    <PrimaryLanguageTabView
      ownerType="person"
      ownerId={person.id}
    />
  );
}

/** Additional multilingual names (read-only chips). */
export function PersonNamesView({
  entity: person,
}: Props) {
  return (
    <EntityNamesTabView
      ownerType="person"
      ownerId={person.id}
    />
  );
}

/** Labeled-website rows, or null when the person has none. */
export function PersonLabeledWebsitesView({
  entity: person,
}: Props) {
  const {
    t,
  } = useTranslation();
  if (person.labeledWebsites.length === 0) return null;
  return (
    <div className="space-y-2">
      {person.labeledWebsites.map((site, index) => (
        <DetailField
          key={`lw-${index}`}
          label={site.label.trim().length > 0 ? site.label : t("Website")}
        >
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {site.url}
          </a>
        </DetailField>
      ))}
    </div>
  );
}

/** Social-link rows, or null when the person has none. */
export function PersonSocialLinksView({
  entity: person,
}: Props) {
  if (person.socialLinks.length === 0) return null;
  return (
    <div className="space-y-2">
      {person.socialLinks.map(link => (
        <DetailField
          key={link.platform}
          label={SOCIAL_MEDIA_PLATFORM_LABELS[link.platform]}
        >
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {link.url}
          </a>
        </DetailField>
      ))}
    </div>
  );
}

/** Year / Plex creator-media rows, or null when neither is set. */
export function PersonCreatorMediaView({
  entity: person,
}: Props) {
  const {
    t,
  } = useTranslation();
  if (person.year == null && person.plexItemTitle == null) return null;
  return (
    <div className="space-y-2">
      {person.year != null ? <DetailField label={t("Year")}>{person.year}</DetailField> : null}
      {person.plexItemTitle != null
        ? <DetailField label={t("Plex")}>{person.plexItemTitle}</DetailField>
        : null}
    </div>
  );
}

/**
 * The whole person General **view**, recomposed from the same placeable view fields the workbench
 * registry uses (in default-layout view order), so this composite — its Storybook story — stays in
 * lockstep with the layout-driven General tab. Stacked with the same `space-y-6` the layout seam uses.
 */
export function PersonGeneralView({
  entity: person,
}: Props) {
  return (
    <div className="space-y-6">
      <PersonAvatarView entity={person} />
      <PersonMetadataView entity={person} />
      <PersonDescriptionView entity={person} />
      <PersonPrimaryLanguageView entity={person} />
      <PersonNamesView entity={person} />
      <PersonLabeledWebsitesView entity={person} />
      <PersonSocialLinksView entity={person} />
      <PersonCreatorMediaView entity={person} />
      <PersonConnectionsView entity={person} />
    </div>
  );
}

/** Connected YouTube channels / websites / groups (view-only summary), or null when there are none. */
export function PersonConnectionsView({
  entity: person,
}: Props) {
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

  const connectedChannels = (channels ?? []).filter(ch => person.youtubeChannelIds.includes(ch.id));
  const connectedWebsites = (websites ?? []).filter(site => person.websiteIds.includes(site.id));
  const connectedGroups = (groups ?? []).filter(pub => person.groupIds.includes(pub.id));
  if (connectedChannels.length + connectedWebsites.length + connectedGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {connectedChannels.map(ch => (
        <DetailField
          key={`ch-${ch.id}`}
          label={t("YouTube Channel")}
        >
          {ch.name}
        </DetailField>
      ))}
      {connectedWebsites.map(site => (
        <DetailField
          key={`site-${site.id}`}
          label={t("Website")}
        >
          {site.siteName}
        </DetailField>
      ))}
      {connectedGroups.map(pub => (
        <DetailField
          key={`pub-${pub.id}`}
          label={t("Group")}
        >
          {pub.name}
        </DetailField>
      ))}
    </div>
  );
}
