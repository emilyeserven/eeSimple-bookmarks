/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Bookmark } from "lucide-react";

import { BookmarkView } from "./BookmarkView";
import { useBookmarks } from "../../../hooks/useBookmarks";
import i18n from "../../../i18n";
import { bookmarkEditWorkbench } from "../../workbench/bookmark";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

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
  label: i18n.t("Bookmarks"),
  singular: i18n.t("Bookmark"),
  icon: Bookmark,
  useList: useBookmarkList,
  View: BookmarkView,
  Edit: BookmarkEdit,
};
