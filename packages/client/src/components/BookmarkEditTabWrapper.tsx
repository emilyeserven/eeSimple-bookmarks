import { createTabWrapper } from "./TabWrapper";

import { useBookmark } from "@/hooks/useBookmarks";

/** Loads a bookmark by id and renders a tab's title + description header above its content. */
export const BookmarkEditTabWrapper = createTabWrapper(
  "bookmarkId",
  useBookmark,
  result => result.data,
  "Bookmark not found.",
);
