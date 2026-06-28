import type { ImageIntent } from "./bookmarkImageIntent";
import type { Bookmark } from "@eesimple/types";

import { useRef, useState } from "react";

import { EMPTY_IMAGE_INTENT } from "./bookmarkImageIntent";
import {
  useAutoBookmarkImage,
  useDeleteBookmarkImage,
  useDeleteBookmarkScreenshot,
  useTakeBookmarkScreenshot,
  useUploadBookmarkImage,
} from "../hooks/useBookmarks";
import { notifySuccess } from "../lib/notifications";

/** Everything `BookmarkImageEditForm`'s JSX needs, with every hook consolidated into this one call. */
export interface BookmarkImageEditFormController {
  /** Remount key for the image field so a successful save clears the staged intent. */
  imageFieldKey: number;
  /** Whether the image save submit is in flight. */
  isPending: boolean;
  /** Whether any image/screenshot mutation is running (disables the controls). */
  isMutating: boolean;
  /** The first image-mutation error to surface, if any. */
  mutationError: Error | null;
  /** Stage the chosen image intent (file / auto / remove) for the next save. */
  onImageChange: (intent: ImageIntent) => void;
  /** Persist the staged image intent. */
  onSubmit: (event: React.FormEvent) => void;
  screenshotDelayMs: number;
  setScreenshotDelayMs: (ms: number) => void;
  takeScreenshotPending: boolean;
  deleteScreenshotPending: boolean;
  onTakeScreenshot: () => void;
  onDeleteScreenshot: () => void;
}

/**
 * Owns the image-edit form's five mutation hooks, staged-intent ref, and submit/screenshot handlers,
 * so the `BookmarkImageEditForm` component stays a thin JSX shell (one hook call instead of nine).
 */
export function useBookmarkImageEditForm(bookmark: Bookmark): BookmarkImageEditFormController {
  const uploadImage = useUploadBookmarkImage();
  const autoImage = useAutoBookmarkImage();
  const deleteImage = useDeleteBookmarkImage();
  const takeScreenshot = useTakeBookmarkScreenshot();
  const deleteScreenshot = useDeleteBookmarkScreenshot();

  const imageIntentRef = useRef<ImageIntent>(EMPTY_IMAGE_INTENT);
  const [imageFieldKey, setImageFieldKey] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [screenshotDelayMs, setScreenshotDelayMs] = useState(0);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setIsPending(true);
    try {
      const intent = imageIntentRef.current;
      if (intent.file) {
        await uploadImage.mutateAsync({
          id: bookmark.id,
          file: intent.file,
        });
      }
      else if (intent.auto) {
        await autoImage.mutateAsync({
          id: bookmark.id,
          sourceUrl: bookmark.url ?? "",
        });
      }
      else if (intent.remove) {
        await deleteImage.mutateAsync(bookmark.id);
      }
      notifySuccess("Changes saved");
      imageIntentRef.current = EMPTY_IMAGE_INTENT;
      setImageFieldKey(key => key + 1);
    }
    catch {
      // Surfaced via mutation hooks' onError toast.
    }
    finally {
      setIsPending(false);
    }
  }

  return {
    imageFieldKey,
    isPending,
    isMutating: uploadImage.isPending || autoImage.isPending || deleteImage.isPending || takeScreenshot.isPending || deleteScreenshot.isPending,
    mutationError: uploadImage.error ?? autoImage.error ?? deleteImage.error,
    onImageChange: (intent) => {
      imageIntentRef.current = intent;
    },
    onSubmit: event => void handleSubmit(event),
    screenshotDelayMs,
    setScreenshotDelayMs,
    takeScreenshotPending: takeScreenshot.isPending,
    deleteScreenshotPending: deleteScreenshot.isPending,
    onTakeScreenshot: () => void takeScreenshot.mutateAsync({
      id: bookmark.id,
      delayMs: screenshotDelayMs || undefined,
    }),
    onDeleteScreenshot: () => void deleteScreenshot.mutateAsync(bookmark.id),
  };
}
