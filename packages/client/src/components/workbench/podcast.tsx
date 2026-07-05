/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { Podcast } from "@eesimple/types";

import { Fragment } from "react";

import { PODCAST_LINK_PROVIDER_LABELS } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import i18n from "../../i18n";
import {
  availablePodcastLinkProviders,
  podcastLinkUrl,
  resolvePodcastDefaultLink,
} from "../../lib/podcastLinks";
import { EntityNamesTabView } from "../entityNames/EntityNamesTab";
import { PodcastAuthorsValue } from "../PodcastAuthorsFields";
import { PodcastGeneralForm } from "../PodcastGeneralForm";
import { PodcastImageTab } from "../PodcastImageTab";

import { useMediaProperties } from "@/hooks/useMediaProperties";
import { useDeletePodcast, usePodcastBySlug, usePodcasts } from "@/hooks/usePodcasts";

function PodcastGeneralView({
  entity: podcast,
}: {
  entity: Podcast;
}) {
  const {
    data: mediaProperties,
  } = useMediaProperties();
  const mediaProperty = podcast.mediaPropertyId
    ? (mediaProperties ?? []).find(prop => prop.id === podcast.mediaPropertyId)
    : undefined;

  const defaultLink = resolvePodcastDefaultLink(podcast);
  const linkProviders = availablePodcastLinkProviders(podcast);
  const {
    t,
  } = useTranslation();

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{t("Added")}</dt>
        <dd>{new Date(podcast.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">{t("Slug")}</dt>
        <dd className="font-mono">{podcast.slug}</dd>
        <dt className="text-muted-foreground">{t("Names")}</dt>
        <dd>
          <EntityNamesTabView
            ownerType="podcast"
            ownerId={podcast.id}
          />
        </dd>
        <dt className="text-muted-foreground">{t("Media property")}</dt>
        <dd>{mediaProperty?.name ?? <span className="text-muted-foreground">{t("None")}</span>}</dd>
        <dt className="text-muted-foreground">{t("Authors")}</dt>
        <dd>
          <PodcastAuthorsValue
            personIds={podcast.personIds}
            groupIds={podcast.groupIds}
          />
        </dd>
        <dt className="text-muted-foreground">{t("Links to")}</dt>
        <dd>
          {defaultLink
            ? (
              <a
                href={defaultLink.url}
                target="_blank"
                rel="noreferrer"
                className="
                  font-medium
                  hover:underline
                "
              >
                {t("View on {{label}}", {
                  label: defaultLink.label,
                })}
              </a>
            )
            : <span className="text-muted-foreground">{t("No service link")}</span>}
        </dd>
        {linkProviders.map((provider) => {
          const url = podcastLinkUrl(podcast, provider);
          if (url == null) return null;
          return (
            <Fragment key={provider}>
              <dt className="text-muted-foreground">{PODCAST_LINK_PROVIDER_LABELS[provider]}</dt>
              <dd>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="
                    break-all
                    hover:underline
                  "
                >
                  {url}
                </a>
              </dd>
            </Fragment>
          );
        })}
        <dt className="text-muted-foreground">{t("Sort order")}</dt>
        <dd>{podcast.sortOrder}</dd>
        {podcast.bookmarkCount != null
          ? (
            <>
              <dt className="text-muted-foreground">{t("Bookmarks")}</dt>
              <dd>{podcast.bookmarkCount}</dd>
            </>
          )
          : null}
      </dl>
    </div>
  );
}

/** Single source of truth for a podcast's view/edit UI (main pane routes + right panel). */
export const podcastWorkbench: EntityWorkbench<Podcast> = {
  useBySlug: (slug) => {
    const {
      podcast, isLoading,
    } = usePodcastBySlug(slug);
    return {
      entity: podcast,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = usePodcasts();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: podcast => podcast.name,
  useDelete: () => {
    const mutation = useDeletePodcast();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Podcast not found."),
  navAriaLabel: i18n.t("Podcast sections"),
  listingPath: "/taxonomies/podcasts",
  getSlug: podcast => podcast.slug,
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      view: {
        title: i18n.t("General"),
        description: i18n.t("Media property, feed, authors, and metadata."),
        render: PodcastGeneralView,
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Name, media property, feed URL, authors, and description."),
        render: ({
          entity,
        }) => <PodcastGeneralForm podcast={entity} />,
      },
    },
    {
      key: "image",
      label: i18n.t("Image"),
      view: {
        title: i18n.t("Image"),
        description: i18n.t("The podcast's artwork."),
        render: ({
          entity,
        }) => (
          <PodcastImageTab
            podcast={entity}
            readOnly
          />
        ),
      },
      edit: {
        title: i18n.t("Image"),
        description: i18n.t("Upload artwork, or import it from the podcast's feed."),
        render: ({
          entity,
        }) => <PodcastImageTab podcast={entity} />,
      },
    },
  ],
};
