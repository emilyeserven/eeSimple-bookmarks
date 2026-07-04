import { createTabWrapper } from "./TabWrapper";

import { useBookmark } from "@/hooks/useBookmarks";
import i18n from "@/i18n";

/** Loads a bookmark by id and renders a tab's title + description header above its content. */
export const BookmarkEditTabWrapper = createTabWrapper(
  "bookmarkId",
  useBookmark,
  result => result.data,
  i18n.t("Bookmark not found."),
);
