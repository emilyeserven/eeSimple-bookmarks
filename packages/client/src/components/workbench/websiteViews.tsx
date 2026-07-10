import type { Website } from "@eesimple/types";

import { WEBSITE_SCAN_OBSERVATION_LABELS } from "@eesimple/types";
import { ExternalLink, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EntityImagePreview } from "../EntityImageField";
import { SourceAutofillDefaults } from "../SourceAutofillDefaults";

import { DetailField } from "@/components/DetailField";
import { Badge } from "@/components/ui/badge";
import { useYouTubeChannels } from "@/hooks/useYouTubeChannels";
import { SOCIAL_MEDIA_PLATFORM_LABELS } from "@/lib/socialLinks";

export { WebsiteHierarchyView } from "./websiteHierarchyView";

/**
 * The read-only website General **view** field components (#1188 field extraction). Each is a
 * placeable {@link import("./types").WorkbenchField} `view` renderer that reads the entity directly (no
 * context) and returns a self-hiding {@link DetailField} row (or its own block), so the layout seam's
 * `space-y-6` stack gaps only the rows that render. `WebsiteGeneralView` at the bottom recomposes them
 * (in the default order) for the story/test.
 */

/** Favicon preview. */
export function WebsiteFaviconView({
  entity: website,
}: {
  entity: Website;
}) {
  return (
    <EntityImagePreview
      imageUrl={website.imageUrl}
      shape="square"
      fallback={<Globe className="size-5" />}
    />
  );
}

/** Domain (external link). */
export function WebsiteDomainView({
  entity: website,
}: {
  entity: Website;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Domain")}>
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
    </DetailField>
  );
}

/** Read-only metadata: Added / Slug / Built-in / Bookmarks. */
export function WebsiteMetadataView({
  entity: website,
}: {
  entity: Website;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <>
      <DetailField label={t("Added")}>
        <span>{new Date(website.createdAt).toLocaleDateString()}</span>
      </DetailField>
      <DetailField label={t("Slug")}>
        <span className="font-mono">{website.slug}</span>
      </DetailField>
      <DetailField label={t("Built-in")}>
        <span>{website.builtIn ? t("Yes — name & domain are fixed") : t("No")}</span>
      </DetailField>
      {website.bookmarkCount != null
        ? (
          <DetailField label={t("Bookmarks")}>
            <span>{website.bookmarkCount}</span>
          </DetailField>
        )
        : null}
    </>
  );
}

/** Scanner observations (blocks crawlers, needs headless rendering, …), or null when none. */
export function WebsiteScanObservationsView({
  entity: website,
}: {
  entity: Website;
}) {
  const {
    t,
  } = useTranslation();
  if (website.scanObservations.length === 0) return null;
  return (
    <DetailField label={t("Scanner observations")}>
      <div className="flex flex-wrap gap-1">
        {website.scanObservations.map(obs => (
          <Badge
            key={obs.kind}
            variant="secondary"
            title={obs.detail}
          >
            {t(WEBSITE_SCAN_OBSERVATION_LABELS[obs.kind])}
          </Badge>
        ))}
      </div>
    </DetailField>
  );
}

/** Description, or null when empty. */
export function WebsiteDescriptionView({
  entity: website,
}: {
  entity: Website;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Description")}>
      {website.description ? <span>{website.description}</span> : null}
    </DetailField>
  );
}

/** Alternate names, or null when none. */
export function WebsiteAlternateNamesView({
  entity: website,
}: {
  entity: Website;
}) {
  const {
    t,
  } = useTranslation();
  if (website.alternateNames.length === 0) return null;
  return (
    <DetailField label={t("Alternate Names")}>
      <span>{website.alternateNames.join(", ")}</span>
    </DetailField>
  );
}

/** Associated YouTube channels, or null when none. */
export function WebsiteYouTubeChannelsView({
  entity: website,
}: {
  entity: Website;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: allChannels,
  } = useYouTubeChannels();
  const associatedChannels = (allChannels ?? []).filter(
    ch => (website.youtubeChannelIds ?? []).includes(ch.id),
  );
  if (associatedChannels.length === 0) return null;
  return (
    <>
      {associatedChannels.map(ch => (
        <DetailField
          key={ch.id}
          label={t("YouTube Channel")}
        >
          <span>{ch.name}</span>
        </DetailField>
      ))}
    </>
  );
}

/** Social media links, or null when none. */
export function WebsiteSocialLinksView({
  entity: website,
}: {
  entity: Website;
}) {
  if (website.socialLinks.length === 0) return null;
  return (
    <>
      {website.socialLinks.map(link => (
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
    </>
  );
}

/** The auto-apply defaults summary (category + media type + tags). */
export function WebsiteSourceDefaultsView({
  entity: website,
}: {
  entity: Website;
}) {
  return (
    <SourceAutofillDefaults
      kind="website"
      category={website.category}
      mediaTypeId={website.mediaTypeId}
      tagIds={website.tagIds}
    />
  );
}

/**
 * The full website General view, recomposed from the granular field views in the default layout order.
 * The Page Layouts path renders these individually from the registry; this recomposition keeps the
 * story/test rendering the whole view unchanged.
 */
export function WebsiteGeneralView({
  entity: website,
}: {
  entity: Website;
}) {
  return (
    <div className="space-y-4">
      <WebsiteFaviconView entity={website} />
      <dl className="space-y-2">
        <WebsiteDomainView entity={website} />
        <WebsiteMetadataView entity={website} />
        <WebsiteDescriptionView entity={website} />
        <WebsiteAlternateNamesView entity={website} />
        <WebsiteYouTubeChannelsView entity={website} />
        <WebsiteSocialLinksView entity={website} />
      </dl>
      <WebsiteSourceDefaultsView entity={website} />
    </div>
  );
}
