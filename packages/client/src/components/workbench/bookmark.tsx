import type { EntityWorkbench } from "./types";
import type { Bookmark } from "@eesimple/types";

import { BookmarkGeneralForm } from "../BookmarkGeneralForm";
import { BookmarkImageEditForm } from "../BookmarkImageEditForm";
import { BookmarkPropertiesForm } from "../BookmarkPropertiesForm";
import { BookmarkVideoEditForm } from "../BookmarkVideoEditForm";

import { useBookmark, useDeleteBookmark } from "@/hooks/useBookmarks";

/**
 * Panel-only edit workbench for bookmarks: stacks the **same** per-tab edit forms the main-app edit
 * tabs render, now in the shared responsive tabbed shell. The bookmark *view* is the shared
 * `BookmarkDetail` (rendered directly by the panel content type), so this descriptor has edit tabs
 * only.
 */
export const bookmarkEditWorkbench: EntityWorkbench<Bookmark> = {
  useBySlug: (id) => {
    const {
      data, isLoading,
    } = useBookmark(id);
    return {
      entity: data,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useBookmark(id);
    return {
      entity: data,
      isLoading,
      error,
    };
  },
  name: bookmark => bookmark.title,
  useDelete: () => {
    const mutation = useDeleteBookmark();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Bookmark not found.",
  navAriaLabel: "Bookmark edit sections",
  getSlug: bookmark => bookmark.id,
  tabs: [
    {
      key: "general",
      label: "General",
      edit: {
        title: "General",
        description: "URL, name, description, category, and tags.",
        render: ({
          entity,
        }) => <BookmarkGeneralForm bookmark={entity} />,
      },
    },
    {
      key: "properties",
      label: "Properties",
      edit: {
        title: "Properties",
        description: "Custom property values for this bookmark.",
        render: ({
          entity,
        }) => <BookmarkPropertiesForm bookmark={entity} />,
      },
    },
    {
      key: "image",
      label: "Image",
      edit: {
        title: "Image",
        description: "Manage the bookmark's thumbnail image.",
        render: ({
          entity,
        }) => <BookmarkImageEditForm bookmark={entity} />,
      },
    },
    {
      key: "video",
      label: "Video",
      edit: {
        title: "Video",
        description: "Capture and manage the bookmark's archived reel video.",
        render: ({
          entity,
        }) => <BookmarkVideoEditForm bookmark={entity} />,
      },
    },
  ],
};
