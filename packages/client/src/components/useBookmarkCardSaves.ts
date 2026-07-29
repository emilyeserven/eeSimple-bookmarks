import type { Bookmark } from "@eesimple/types";

import { useAutoBookmarkImage, useUpdateBookmark } from "../hooks/useBookmarks";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { mergeBooleanValue } from "../lib/bookmarkFormat";
import { selectIsBookmarkQueued, useScreenshotQueueStore } from "../stores/screenshotQueueStore";

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
 * card component stays under the import/hook caps. Each save handler PATCHes one typed value array
 * and toasts the named property/field (edit-tab auto-save standard).
 */
export function useBookmarkCardSaves(bookmark: Bookmark) {
  const autoImage = useAutoBookmarkImage();
  const enqueueScreenshot = useScreenshotQueueStore(state => state.enqueue);
  const screenshotQueued = useScreenshotQueueStore(selectIsBookmarkQueued(bookmark.id));
  const updateBookmark = useUpdateBookmark();
  const {
    data: customProperties,
  } = useCustomProperties();

  /** The toast label for a property save: the property's name (already in cache for the card). */
  function propertyLabel(propertyId: string): string {
    return customProperties?.find(p => p.id === propertyId)?.name ?? "Property";
  }

  /** The shared field-named success/error callbacks for one save. */
  function fieldCallbacks(label: string) {
    return {
      onSuccess: () => notifyFieldSaved(label),
      onError: (error: Error) => notifyFieldSaveError(label, describeError(error)),
    };
  }

  function saveNumber(propertyId: string, value: number) {
    updateBookmark.mutate({
      id: bookmark.id,
      input: {
        numberValues: mergePropertyEntry(bookmark.numberValues, {
          propertyId,
          value,
        }),
      },
    }, fieldCallbacks(propertyLabel(propertyId)));
  }

  function saveBoolean(propertyId: string, value: boolean) {
    updateBookmark.mutate({
      id: bookmark.id,
      input: {
        booleanValues: mergeBooleanValue(bookmark.booleanValues, propertyId, value),
      },
    }, fieldCallbacks(propertyLabel(propertyId)));
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
    }, fieldCallbacks(propertyLabel(propertyId)));
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
    }, fieldCallbacks(propertyLabel(propertyId)));
  }

  function saveTags(tagIds: string[]) {
    updateBookmark.mutate({
      id: bookmark.id,
      input: {
        tagIds,
      },
    }, fieldCallbacks("Tags"));
  }

  return {
    autoImage,
    screenshotPending: screenshotQueued,
    onScreenshot: () => enqueueScreenshot({
      id: bookmark.id,
    }),
    saveNumber,
    saveBoolean,
    saveDateTime,
    saveChoices,
    saveTags,
  };
}
