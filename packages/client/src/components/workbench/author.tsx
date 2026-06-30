import type { EntityWorkbench } from "./types";
import type { Author } from "@eesimple/types";

import { AuthorGeneralForm } from "../AuthorGeneralForm";
import { AuthorPublishersForm, AuthorPublishersView } from "../AuthorPublishersForm";
import { AuthorWebsitesForm, AuthorWebsitesView } from "../AuthorWebsitesForm";
import { AuthorYouTubeChannelsForm, AuthorYouTubeChannelsView } from "../AuthorYouTubeChannelsForm";
import { AuthorGeneralView } from "./authorViews";

import { useAuthorById, useAuthorBySlug, useDeleteAuthor } from "@/hooks/useAuthors";

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
