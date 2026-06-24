/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { Publisher } from "@eesimple/types";

import { PublisherGeneralForm } from "../PublisherGeneralForm";

import { useDeletePublisher, usePublisherBySlug, usePublishers } from "@/hooks/usePublishers";

function PublisherGeneralView({
  entity: publisher,
}: {
  entity: Publisher;
}) {
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Added</dt>
      <dd>{new Date(publisher.createdAt).toLocaleDateString()}</dd>
      <dt className="text-muted-foreground">Slug</dt>
      <dd className="font-mono">{publisher.slug}</dd>
      {publisher.website != null
        ? (
          <>
            <dt className="text-muted-foreground">Website</dt>
            <dd>
              {publisher.website.siteName
                ? `${publisher.website.siteName} (${publisher.website.domain})`
                : publisher.website.domain}
            </dd>
          </>
        )
        : null}
      {publisher.bookmarkCount != null
        ? (
          <>
            <dt className="text-muted-foreground">Bookmarks</dt>
            <dd>{publisher.bookmarkCount}</dd>
          </>
        )
        : null}
    </dl>
  );
}

/** Single source of truth for a publisher's tabbed view/edit UI (main pane routes + right panel). */
export const publisherWorkbench: EntityWorkbench<Publisher> = {
  useBySlug: (slug) => {
    const {
      publisher, isLoading,
    } = usePublisherBySlug(slug);
    return {
      entity: publisher,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = usePublishers();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: publisher => publisher.name,
  useDelete: () => {
    const mutation = useDeletePublisher();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Publisher not found.",
  navAriaLabel: "Publisher sections",
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Name and associated website.",
        render: PublisherGeneralView,
      },
      edit: {
        title: "General",
        description: "Edit the publisher's name and website association.",
        render: ({
          entity,
        }) => <PublisherGeneralForm publisher={entity} />,
      },
    },
  ],
};
