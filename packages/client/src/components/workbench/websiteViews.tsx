import type { Website } from "@eesimple/types";

import { ExternalLink, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EntityImagePreview } from "../EntityImageField";
import { SourceAutofillDefaults } from "../SourceAutofillDefaults";

import { useYouTubeChannels } from "@/hooks/useYouTubeChannels";
import { SOCIAL_MEDIA_PLATFORM_LABELS } from "@/lib/socialLinks";

export { WebsiteHierarchyView } from "./websiteHierarchyView";

export function WebsiteGeneralView({
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

  return (
    <div className="space-y-4">
      <EntityImagePreview
        imageUrl={website.imageUrl}
        shape="square"
        fallback={<Globe className="size-5" />}
      />
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{t("Domain")}</dt>
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
        <dt className="text-muted-foreground">{t("Added")}</dt>
        <dd>{new Date(website.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">{t("Slug")}</dt>
        <dd className="font-mono">{website.slug}</dd>
        <dt className="text-muted-foreground">{t("Built-in")}</dt>
        <dd>{website.builtIn ? t("Yes — name & domain are fixed") : t("No")}</dd>
        {website.description
          ? (
            <>
              <dt className="text-muted-foreground">{t("Description")}</dt>
              <dd>{website.description}</dd>
            </>
          )
          : null}
        {website.alternateNames.length > 0
          ? (
            <>
              <dt className="text-muted-foreground">{t("Alternate Names")}</dt>
              <dd>{website.alternateNames.join(", ")}</dd>
            </>
          )
          : null}
        {website.bookmarkCount != null
          ? (
            <>
              <dt className="text-muted-foreground">{t("Bookmarks")}</dt>
              <dd>{website.bookmarkCount}</dd>
            </>
          )
          : null}
        {associatedChannels.map(ch => (
          <>
            <dt
              key={`ch-label-${ch.id}`}
              className="text-muted-foreground"
            >{t("YouTube Channel")}
            </dt>
            <dd key={`ch-value-${ch.id}`}>{ch.name}</dd>
          </>
        ))}
        {website.socialLinks.map(link => (
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
      <SourceAutofillDefaults
        kind="website"
        category={website.category}
        mediaTypeId={website.mediaTypeId}
        tagIds={website.tagIds}
      />
    </div>
  );
}
