import { useNavigate } from "@tanstack/react-router";
import { PanelLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { usePanelControls, usePanelDismissAfterDelete } from "./panelHelpers";
import { WithPanelItem } from "./status";
import { useBookmarkViewData } from "./useBookmarkViewData";
import { useDeleteBookmark, useUpdateBookmark } from "../../../hooks/useBookmarks";
import { mergeBooleanValue } from "../../../lib/bookmarkFormat";
import { BookmarkDetail } from "../../BookmarkDetail";

import { Button } from "@/components/ui/button";

/**
 * Read-only bookmark, reusing the same `BookmarkDetail` the full detail page renders. A bookmark's
 * view is a single rich component (not tabbed), so unlike the other content types it stays bespoke
 * rather than going through the workbench.
 */
export function BookmarkView({
  id,
}: {
  id: string;
}) {
  const {
    bookmarksQuery, properties, propertyGroups, categories,
  } = useBookmarkViewData();
  const {
    openItem, close,
  } = usePanelControls();
  const dismiss = usePanelDismissAfterDelete();
  const deleteBookmark = useDeleteBookmark();
  const updateBookmark = useUpdateBookmark();
  const navigate = useNavigate();
  const {
    t,
  } = useTranslation();

  return (
    <WithPanelItem
      queryResult={bookmarksQuery}
      id={id}
      notFoundMessage={t("Bookmark not found.")}
    >
      {bookmark => (
        <>
          <div className="mb-2 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label={t("Open in main pane")}
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
