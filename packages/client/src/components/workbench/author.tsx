/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { Author } from "@eesimple/types";

import { UserCircle } from "lucide-react";

import { AuthorGeneralForm } from "../AuthorGeneralForm";
import { AuthorPublishersForm, AuthorPublishersView } from "../AuthorPublishersForm";
import { AuthorWebsitesForm, AuthorWebsitesView } from "../AuthorWebsitesForm";
import { AuthorYouTubeChannelsForm, AuthorYouTubeChannelsView } from "../AuthorYouTubeChannelsForm";
import { EntityImagePreview } from "../EntityImageField";

import { useAuthorById, useAuthorBySlug, useDeleteAuthor } from "@/hooks/useAuthors";
import { usePublishers } from "@/hooks/usePublishers";
import { useWebsites } from "@/hooks/useWebsites";
import { useYouTubeChannels } from "@/hooks/useYouTubeChannels";
import { SOCIAL_MEDIA_PLATFORM_LABELS } from "@/lib/socialLinks";

function AuthorGeneralView({
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

/** Single source of truth for an author's tabbed view/edit UI (main pane routes + right panel). */
export const authorWorkbench: EntityWorkbench<Author> = {
  useBySlug: (slug) => {
    const {
      author, isLoading,
    } = useAuthorBySlug(slug);
    return {
      entity: author,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      author, isLoading, error,
    } = useAuthorById(id);
    return {
      entity: author,
      isLoading,
      error: error ?? null,
    };
  },
  name: author => author.name,
  useDelete: () => {
    const mutation = useDeleteAuthor();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Author not found.",
  navAriaLabel: "Author sections",
  getSlug: author => author.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Author details.",
        render: AuthorGeneralView,
      },
      edit: {
        title: "General",
        description: "Edit the author's name, URLs, and avatar.",
        render: ({
          entity,
        }) => <AuthorGeneralForm author={entity} />,
      },
    },
    {
      key: "youtube-channels",
      label: "YouTube Channels",
      view: {
        title: "YouTube Channels",
        description: "YouTube channels associated with this author.",
        render: ({
          entity,
        }) => <AuthorYouTubeChannelsView author={entity} />,
      },
      edit: {
        title: "YouTube Channels",
        description: "Connect YouTube channels to this author.",
        render: ({
          entity,
        }) => <AuthorYouTubeChannelsForm author={entity} />,
      },
    },
    {
      key: "websites",
      label: "Websites",
      view: {
        title: "Websites",
        description: "Websites associated with this author.",
        render: ({
          entity,
        }) => <AuthorWebsitesView author={entity} />,
      },
      edit: {
        title: "Websites",
        description: "Connect websites to this author.",
        render: ({
          entity,
        }) => <AuthorWebsitesForm author={entity} />,
      },
    },
    {
      key: "publishers",
      label: "Publishers",
      view: {
        title: "Publishers",
        description: "Publishers associated with this author.",
        render: ({
          entity,
        }) => <AuthorPublishersView author={entity} />,
      },
      edit: {
        title: "Publishers",
        description: "Connect publishers to this author.",
        render: ({
          entity,
        }) => <AuthorPublishersForm author={entity} />,
      },
    },
  ],
};
