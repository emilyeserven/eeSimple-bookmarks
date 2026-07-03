/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { MediaProperty } from "@eesimple/types";

import { MediaPropertyGeneralForm } from "../MediaPropertyGeneralForm";

import {
  useDeleteMediaProperty,
  useMediaProperties,
  useMediaPropertyBySlug,
} from "@/hooks/useMediaProperties";

function MediaPropertyGeneralView({
  entity: mediaProperty,
}: {
  entity: MediaProperty;
}) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Added</dt>
        <dd>{new Date(mediaProperty.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{mediaProperty.slug}</dd>
        <dt className="text-muted-foreground">Sort order</dt>
        <dd>{mediaProperty.sortOrder}</dd>
        {mediaProperty.bookCount != null
          ? (
            <>
              <dt className="text-muted-foreground">Books</dt>
              <dd>{mediaProperty.bookCount}</dd>
            </>
          )
          : null}
      </dl>
    </div>
  );
}

/** Single source of truth for a media property's view/edit UI (main pane routes + right panel). */
export const mediaPropertyWorkbench: EntityWorkbench<MediaProperty> = {
  useBySlug: (slug) => {
    const {
      mediaProperty, isLoading,
    } = useMediaPropertyBySlug(slug);
    return {
      entity: mediaProperty,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useMediaProperties();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: mediaProperty => mediaProperty.name,
  useDelete: () => {
    const mutation = useDeleteMediaProperty();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Media property not found.",
  navAriaLabel: "Media property sections",
  getSlug: mediaProperty => mediaProperty.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Name, sort order, and metadata.",
        render: MediaPropertyGeneralView,
      },
      edit: {
        title: "General",
        description: "Name and sort order.",
        render: ({
          entity,
        }) => <MediaPropertyGeneralForm mediaProperty={entity} />,
      },
    },
  ],
};
