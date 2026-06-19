/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Bookmark } from "lucide-react";

import { usePanelControls, usePanelDismissAfterDelete } from "./panelHelpers";
import { Loading, Problem } from "./status";
import { useBookmarks, useDeleteBookmark } from "../../../hooks/useBookmarks";
import { useCategories } from "../../../hooks/useCategories";
import { useCustomProperties } from "../../../hooks/useCustomProperties";
import { usePropertyGroups } from "../../../hooks/usePropertyGroups";
import { BookmarkDetail } from "../../BookmarkDetail";
import { BookmarkForm } from "../../BookmarkForm";

function useBookmarkList() {
  const {
    data, isLoading, error,
  } = useBookmarks();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(bookmark => ({
      id: bookmark.id,
      label: bookmark.title,
      sublabel: bookmark.url,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only bookmark, reusing the same `BookmarkDetail` the full detail page renders. */
function BookmarkView({
  id,
}: {
  id: string;
}) {
  const {
    data: bookmarks, isLoading, error,
  } = useBookmarks();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: propertyGroups,
  } = usePropertyGroups();
  const {
    data: categories,
  } = useCategories();
  const {
    openItem,
  } = usePanelControls();
  const dismiss = usePanelDismissAfterDelete();
  const deleteBookmark = useDeleteBookmark();

  if (isLoading) return <Loading />;
  if (error) return <Problem>{error.message}</Problem>;
  const bookmark = (bookmarks ?? []).find(item => item.id === id);
  if (!bookmark) return <Problem>Bookmark not found.</Problem>;

  return (
    <BookmarkDetail
      bookmark={bookmark}
      categories={categories ?? []}
      properties={properties ?? []}
      propertyGroups={propertyGroups ?? []}
      onEdit={() => openItem("bookmark", id, "edit")}
      onDelete={() => deleteBookmark.mutate(id, {
        onSuccess: dismiss,
      })}
    />
  );
}

/** Edit a bookmark with the same `BookmarkForm` the main app uses. */
function BookmarkEdit({
  id,
}: {
  id: string;
}) {
  const {
    data: bookmarks, isLoading, error,
  } = useBookmarks();
  const {
    openItem,
  } = usePanelControls();

  if (isLoading) return <Loading />;
  if (error) return <Problem>{error.message}</Problem>;
  const bookmark = (bookmarks ?? []).find(item => item.id === id);
  if (!bookmark) return <Problem>Bookmark not found.</Problem>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Edit bookmark</h2>
      <BookmarkForm
        bookmark={bookmark}
        onDone={() => openItem("bookmark", id, "view")}
      />
    </div>
  );
}

export const bookmarkContentType: PanelContentTypeDef = {
  type: "bookmark",
  label: "Bookmarks",
  singular: "Bookmark",
  icon: Bookmark,
  useList: useBookmarkList,
  View: BookmarkView,
  Edit: BookmarkEdit,
};
