import type { useBookmarkFormActions } from "./useBookmarkFormActions";
import type { useBookmarkUrlProcessing } from "./useBookmarkUrlProcessing";
import type { Bookmark, UpdateBookmarkInput, YouTubeChannelHint } from "@eesimple/types";
import type { RefObject } from "react";

import { useRef } from "react";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

/** Field-name labels for the General tab's per-field auto-save toasts ("Updated <label>"). */
const BOOKMARK_GENERAL_LABELS: Partial<Record<keyof UpdateBookmarkInput, string>> = {
  title: "Name",
  description: "Description",
  categoryId: "Category",
  mediaTypeId: "Media type",
};

/** The slice of the bookmark form the URL/Name/Description auto-save helpers read from. */
interface BookmarkFieldReader {
  getFieldValue: (name: "url" | "title" | "description") => string;
}

interface UseBookmarkGeneralAutoSaveParams {
  bookmark: Bookmark;
  form: BookmarkFieldReader;
  updateBookmark: ReturnType<typeof useBookmarkFormActions>["updateBookmark"];
  resolveSubmitUrl: ReturnType<typeof useBookmarkUrlProcessing>["resolveSubmitUrl"];
  channelHintRef: RefObject<YouTubeChannelHint | null>;
}

/**
 * The bookmark General edit tab's per-field auto-save (edit-tab standard — no Save button). Owns the
 * {@link useFieldAutoSave} engine for the single-key scalar fields plus the bespoke URL save (which
 * resolves a `{ url, originalUrl }` pair and the YouTube channel hint, so it can't use the engine).
 * Kept out of `useBookmarkGeneralForm` so that hook's cognitive complexity doesn't rise (mirrors
 * `useBookmarkSyncRegistration`).
 */
export function useBookmarkGeneralAutoSave({
  bookmark, form, updateBookmark, resolveSubmitUrl, channelHintRef,
}: UseBookmarkGeneralAutoSaveParams) {
  // Deep-equal no-op skip means re-blurring an unchanged field, or a programmatic setter writing the
  // same value, never re-saves or re-toasts.
  const autoSave = useFieldAutoSave<UpdateBookmarkInput, Bookmark>({
    id: bookmark.id,
    update: updateBookmark,
    labels: BOOKMARK_GENERAL_LABELS,
    initial: {
      title: bookmark.title,
      description: bookmark.description ?? null,
      categoryId: bookmark.categoryId ?? "",
      mediaTypeId: bookmark.mediaType?.id ?? null,
    },
  });

  const savedUrlRef = useRef<string | null>(bookmark.url ?? null);

  // The URL can't use the single-key engine: it resolves to a `{ url, originalUrl }` pair (cleanup)
  // plus an optional YouTube channel hint. Persist all three at once, skipping when the resolved URL
  // is unchanged so a plain tab-out of the field doesn't re-save or toast.
  function saveUrl(): void {
    const {
      finalUrl, originalUrl,
    } = resolveSubmitUrl(form.getFieldValue("url"), false);
    if (finalUrl === savedUrlRef.current) return;
    updateBookmark.mutate(
      {
        id: bookmark.id,
        input: {
          url: finalUrl,
          originalUrl,
          ...(channelHintRef.current && {
            youtubeChannel: channelHintRef.current,
          }),
        },
      },
      {
        onSuccess: () => {
          savedUrlRef.current = finalUrl;
          notifyFieldSaved("URL");
        },
        onError: e => notifyFieldSaveError("URL", describeError(e)),
      },
    );
  }

  /** Persist the Name field's current value (invalid when blank; no-op when unchanged). */
  function saveTitle(): void {
    const title = form.getFieldValue("title");
    autoSave.saveField("title", title, {
      valid: title.trim().length > 0,
    });
  }

  /** Persist the Description field's current value (no-op when unchanged). */
  function saveDescription(): void {
    autoSave.saveField("description", form.getFieldValue("description").trim() || null);
  }

  return {
    saveField: autoSave.saveField,
    saveUrl,
    saveTitle,
    saveDescription,
  };
}
