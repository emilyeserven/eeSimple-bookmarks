/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { useNavigate } from "@tanstack/react-router";
import { Bookmark, PanelLeft } from "lucide-react";

import { usePanelControls, usePanelDismissAfterDelete } from "./panelHelpers";
import { WithPanelItem } from "./status";
import { useBookmarks, useDeleteBookmark, useUpdateBookmark } from "../../../hooks/useBookmarks";
import { useCategories } from "../../../hooks/useCategories";
import { useCustomProperties } from "../../../hooks/useCustomProperties";
import { usePropertyGroups } from "../../../hooks/usePropertyGroups";
import { mergeBooleanValue } from "../../../lib/bookmarkFormat";
import { BookmarkDetail } from "../../BookmarkDetail";
import { bookmarkEditWorkbench } from "../../workbench/bookmark";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

import { Button } from "@/components/ui/button";

function useBookmarkList() {
  const {
    data, isLoading, error,
  } = useBookmarks();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(bookmark => ({
      id: bookmark.id,
      label: bookmark.title,
      sublabel: bookmark.url ?? undefined,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/**
 * Read-only bookmark, reusing the same `BookmarkDetail` the full detail page renders. A bookmark's
 * view is a single rich component (not tabbed), so unlike the other content types it stays bespoke
 * rather than going through the workbench.
 */
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
    openItem, close,
  } = usePanelControls();
  const dismiss = usePanelDismissAfterDelete();
  const deleteBookmark = useDeleteBookmark();
  const updateBookmark = useUpdateBookmark();
  const navigate = useNavigate();

  return (
    <WithPanelItem
      queryResult={bookmarksQuery}
      id={id}
      notFoundMessage="Bookmark not found."
    >
      {bookmark => (
        <>
          <div className="mb-2 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Open in main pane"
              onClick={() => {
                void navigate({
                  href: `/bookmarks/${id}`,
                });
                close();
              }}
            >
              <PanelLeft className="size-4" />
            </Button>
          </div>
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
        </>
      )}
    </WithPanelItem>
  );
}

/**
 * Edit a bookmark with the **same** per-tab edit forms the main-app edit tabs render
 * (`BookmarkGeneralForm` / `BookmarkPropertiesForm` / `BookmarkImageEditForm` /
 * `BookmarkRelationshipsEditor`), now in the shared responsive tabbed shell — not the `BookmarkForm`
 * create form (that stays for create flows).
 */
function BookmarkEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={bookmarkEditWorkbench}
      id={id}
      mode="edit"
      contentType="bookmark"
    />
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
