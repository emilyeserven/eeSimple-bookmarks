/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { Website } from "@eesimple/types";

import { ExternalLink, Globe } from "lucide-react";

import { EntityImagePreview } from "../EntityImageField";
import { ParamRulesList } from "../ParamRulesList";
import { ShortenedLinksList } from "../ShortenedLinksList";
import { SourceAutofillDefaults } from "../SourceAutofillDefaults";
import { WebsiteGeneralForm } from "../WebsiteGeneralForm";
import { WebsiteParamRulesForm } from "../WebsiteParamRulesForm";
import { WebsiteShortenedLinksForm } from "../WebsiteShortenedLinksForm";

import { useDeleteWebsite, useWebsiteBySlug, useWebsites } from "@/hooks/useWebsites";
import { useYouTubeChannels } from "@/hooks/useYouTubeChannels";
import { SOCIAL_MEDIA_PLATFORM_LABELS } from "@/lib/socialLinks";

function WebsiteGeneralView({
  entity: website,
}: {
  entity: Website;
}) {
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
        {website.alternateNames.length > 0
          ? (
            <>
              <dt className="text-muted-foreground">Alternate Names</dt>
              <dd>{website.alternateNames.join(", ")}</dd>
            </>
          )
          : null}
        {website.bookmarkCount != null
          ? (
            <>
              <dt className="text-muted-foreground">Bookmarks</dt>
              <dd>{website.bookmarkCount}</dd>
            </>
          )
          : null}
        {associatedChannels.map(ch => (
          <>
            <dt
              key={`ch-label-${ch.id}`}
              className="text-muted-foreground"
            >YouTube Channel
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

/**
 * The single source of truth for a website's tabbed view/edit UI, shared by the main pane routes
 * (`taxonomies.websites.$websiteSlug.*`) and the right panel (`contentTypes/website.tsx`).
 */
export const websiteWorkbench: EntityWorkbench<Website> = {
  useBySlug: (slug) => {
    const {
      website, isLoading,
    } = useWebsiteBySlug(slug);
    return {
      entity: website,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useWebsites();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: website => website.siteName,
  isBuiltIn: website => website.builtIn,
  useDelete: () => {
    const mutation = useDeleteWebsite();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Website not found.",
  navAriaLabel: "Website sections",
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Domain, creation date, and metadata.",
        render: WebsiteGeneralView,
      },
      edit: {
        title: "General",
        description: "Site name and domain.",
        render: ({
          entity,
        }) => <WebsiteGeneralForm website={entity} />,
      },
    },
    {
      key: "shortened-links",
      label: "Shortened Links",
      view: {
        title: "Shortened Links",
        description: "Short domains that resolve to this site and how they expand.",
        render: ({
          entity,
        }) => (
          <ShortenedLinksList
            links={entity.shortenedLinks}
            emptyText="None configured."
          />
        ),
      },
      edit: {
        title: "Shortened Links",
        description: "Short domains that resolve to this site and how they expand.",
        render: ({
          entity,
        }) => <WebsiteShortenedLinksForm website={entity} />,
      },
    },
    {
      key: "param-rules",
      label: "Param Rules",
      view: {
        title: "Param Rules",
        description: "For matching paths, only these query params are kept; the rest are stripped.",
        render: ({
          entity,
        }) => (
          <ParamRulesList
            rules={entity.paramRules}
            emptyText="None configured."
          />
        ),
      },
      edit: {
        title: "Param Rules",
        description: "Path-scoped query-param whitelist: only listed params are kept, the rest are stripped.",
        render: ({
          entity,
        }) => <WebsiteParamRulesForm website={entity} />,
      },
    },
  ],
};
