import type { Bookmark } from "@eesimple/types";

import { useAutoBookmarkImage, useTakeBookmarkScreenshot, useUpdateBookmark } from "../hooks/useBookmarks";
import { mergeBooleanValue } from "../lib/bookmarkFormat";

/** Replace the entry for `propertyId` in a typed value array, or append it when missing. */
function mergePropertyEntry<T extends { propertyId: string }>(entries: T[], next: T): T[] {
  const {
    propertyId,
  } = next;
  return entries.some(e => e.propertyId === propertyId)
    ? entries.map(e => (e.propertyId === propertyId ? next : e))
    : [...entries, next];
}

/**
 * Owns a bookmark card's inline-edit save handlers plus the auto-image / screenshot mutations, so the
 * card component stays under the import/hook caps. Each save handler PATCHes one typed value array.
 */
export function useBookmarkCardSaves(bookmark: Bookmark) {
  const autoImage = useAutoBookmarkImage();
  const screenshot = useTakeBookmarkScreenshot();
  const updateBookmark = useUpdateBookmark();

  function saveNumber(propertyId: string, value: number) {
    updateBookmark.mutate({
      id: bookmark.id,
      input: {
        numberValues: mergePropertyEntry(bookmark.numberValues, {
          propertyId,
          value,
        }),
      },
    });
  }

  function saveBoolean(propertyId: string, value: boolean) {
    updateBookmark.mutate({
      id: bookmark.id,
      input: {
        booleanValues: mergeBooleanValue(bookmark.booleanValues, propertyId, value),
      },
    });
  }

  function saveDateTime(propertyId: string, value: string) {
    updateBookmark.mutate({
      id: bookmark.id,
      input: {
        dateTimeValues: mergePropertyEntry(bookmark.dateTimeValues, {
          propertyId,
          value,
        }),
      },
    });
  }

  function saveChoices(propertyId: string, values: string[]) {
    updateBookmark.mutate({
      id: bookmark.id,
      input: {
        choicesValues: mergePropertyEntry(bookmark.choicesValues, {
          propertyId,
          values,
        }),
      },
    });
  }

  function saveTags(tagIds: string[]) {
    updateBookmark.mutate({
      id: bookmark.id,
      input: {
        tagIds,
      },
    });
  }

  return {
    autoImage,
    screenshot,
    saveNumber,
    saveBoolean,
    saveDateTime,
    saveChoices,
    saveTags,
  };
}
