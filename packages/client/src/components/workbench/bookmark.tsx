import type { EntityWorkbench } from "./types";
import type { Bookmark } from "@eesimple/types";

import i18n from "../../i18n";
import { BookmarkGeneralForm } from "../BookmarkGeneralForm";
import { BookmarkImageEditForm } from "../BookmarkImageEditForm";
import { BookmarkPropertiesForm } from "../BookmarkPropertiesForm";
import { BookmarkRelatedForm } from "../BookmarkRelatedForm";
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
  notFound: i18n.t("Bookmark not found."),
  navAriaLabel: i18n.t("Bookmark edit sections"),
  getSlug: bookmark => bookmark.id,
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      edit: {
        title: i18n.t("General"),
        description: i18n.t("URL, name, description, category, and tags."),
        render: ({
          entity,
        }) => <BookmarkGeneralForm bookmark={entity} />,
      },
    },
    {
      key: "related",
      label: i18n.t("Related"),
      edit: {
        title: i18n.t("Related"),
        description: i18n.t("Relationships, creators, locations, genres, and media identity."),
        render: ({
          entity,
        }) => <BookmarkRelatedForm bookmark={entity} />,
      },
    },
    {
      key: "properties",
      label: i18n.t("Properties"),
      edit: {
        title: i18n.t("Properties"),
        description: i18n.t("Custom property values for this bookmark."),
        render: ({
          entity,
        }) => <BookmarkPropertiesForm bookmark={entity} />,
      },
    },
    {
      key: "image",
      label: i18n.t("Image"),
      edit: {
        title: i18n.t("Image"),
        description: i18n.t("Manage the bookmark's thumbnail image."),
        render: ({
          entity,
        }) => <BookmarkImageEditForm bookmark={entity} />,
      },
    },
    {
      key: "video",
      label: i18n.t("Video"),
      edit: {
        title: i18n.t("Video"),
        description: i18n.t("Capture and manage the bookmark's archived reel video."),
        render: ({
          entity,
        }) => <BookmarkVideoEditForm bookmark={entity} />,
      },
    },
  ],
};
