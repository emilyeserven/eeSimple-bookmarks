/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Bookmark } from "lucide-react";

import { usePanelControls, usePanelDismissAfterDelete } from "./panelHelpers";
import { WithPanelItem } from "./status";
import { useBookmarks, useDeleteBookmark, useUpdateBookmark } from "../../../hooks/useBookmarks";
import { useCategories } from "../../../hooks/useCategories";
import { useCustomProperties } from "../../../hooks/useCustomProperties";
import { usePropertyGroups } from "../../../hooks/usePropertyGroups";
import { mergeBooleanValue } from "../../../lib/bookmarkFormat";
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
  const bookmarksQuery = useBookmarks();
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
  const updateBookmark = useUpdateBookmark();

  return (
    <WithPanelItem
      queryResult={bookmarksQuery}
      id={id}
      notFoundMessage="Bookmark not found."
    >
      {bookmark => (
        <BookmarkDetail
          bookmark={bookmark}
          categories={categories ?? []}
          properties={properties ?? []}
          propertyGroups={propertyGroups ?? []}
          onEdit={() => openItem("bookmark", id, "edit")}
          onDelete={() => deleteBookmark.mutate(id, {
            onSuccess: dismiss,
          })}
          onSaveBoolean={(propertyId, value) => updateBookmark.mutate({
            id: bookmark.id,
            input: {
              booleanValues: mergeBooleanValue(bookmark.booleanValues, propertyId, value),
            },
          })}
        />
      )}
    </WithPanelItem>
  );
}

/** Edit a bookmark with the same `BookmarkForm` the main app uses. */
function BookmarkEdit({
  id,
}: {
  id: string;
}) {
  const bookmarksQuery = useBookmarks();
  const {
    openItem,
  } = usePanelControls();

  return (
    <WithPanelItem
      queryResult={bookmarksQuery}
      id={id}
      notFoundMessage="Bookmark not found."
    >
      {bookmark => (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Edit bookmark</h2>
          <BookmarkForm
            bookmark={bookmark}
            onDone={() => openItem("bookmark", id, "view")}
          />
        </div>
      )}
    </WithPanelItem>
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
