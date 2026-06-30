import type { ImageIntent } from "./bookmarkImageIntent";
import type { Bookmark, ImageCandidate } from "@eesimple/types";

import { useRef, useState } from "react";

import { EMPTY_IMAGE_INTENT } from "./bookmarkImageIntent";
import { applyImageIntent } from "./bookmarkSubmit";
import {
  useAddBookmarkImage,
  useAutoBookmarkImage,
  useBookmarkImagesFromCandidates,
  useDeleteBookmarkImageById,
  useDeleteBookmarkScreenshot,
  useSetMainBookmarkImage,
  useTakeBookmarkScreenshot,
} from "../hooks/useBookmarks";
import { metadataApi } from "../lib/api/metadata";
import { notifySuccess } from "../lib/notifications";

/** Everything `BookmarkImageEditForm`'s JSX needs, with every hook consolidated into this one call. */
export interface BookmarkImageEditFormController {
  /** Remount key for the image picker so a successful save clears the staged intent. */
  imageFieldKey: number;
  /** Whether the image save submit is in flight. */
  isPending: boolean;
  /** Whether any image/screenshot mutation is running (disables the controls). */
  isMutating: boolean;
  /** The first image-mutation error to surface, if any. */
  mutationError: Error | null;
  /** Candidate images discovered by "Find images on page", offered in the picker. */
  candidates: ImageCandidate[];
  /** Whether the page scan is in flight. */
  isScanning: boolean;
  /** Scan the bookmark's page for more images to choose from. */
  onFindImages: () => void;
  /** Whether the direct page-image (og:image) fetch is in flight. */
  getPageImagePending: boolean;
  /** Fetch the page's preview image (og:image) directly and add it to the bookmark. */
  onGetPageImage: () => void;
  /** Stage the chosen image intent (uploads / kept candidates / main / removals) for the next save. */
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
 * Owns the image-edit tab's mutation hooks, staged-intent ref, page-scan, and submit/screenshot
 * handlers, so the `BookmarkImageEditForm` component stays a thin JSX shell. The bookmark already
 * exists here, so a save applies the same multi-image {@link applyImageIntent} the create form uses.
 */
export function useBookmarkImageEditForm(bookmark: Bookmark): BookmarkImageEditFormController {
  const autoImage = useAutoBookmarkImage();
  const addImage = useAddBookmarkImage();
  const imagesFromCandidates = useBookmarkImagesFromCandidates();
  const setMainImage = useSetMainBookmarkImage();
  const deleteImageById = useDeleteBookmarkImageById();
  const takeScreenshot = useTakeBookmarkScreenshot();
  const deleteScreenshot = useDeleteBookmarkScreenshot();

  const imageIntentRef = useRef<ImageIntent>(EMPTY_IMAGE_INTENT);
  const [imageFieldKey, setImageFieldKey] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [candidates, setCandidates] = useState<ImageCandidate[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [screenshotDelayMs, setScreenshotDelayMs] = useState(0);

  async function handleFindImages(): Promise<void> {
    if (!bookmark.url) return;
    setIsScanning(true);
    try {
      const scan = await metadataApi.scan({
        url: bookmark.url,
      });
      setCandidates(scan.imageCandidates);
    }
    catch {
      // Non-fatal: best-effort convenience.
    }
    finally {
      setIsScanning(false);
    }
  }

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setIsPending(true);
    try {
      await applyImageIntent(bookmark.id, bookmark.url ?? "", imageIntentRef.current, {
        autoImage,
        addImage,
        imagesFromCandidates,
        setMainImage,
        deleteImageById,
      });
      notifySuccess("Changes saved");
      imageIntentRef.current = EMPTY_IMAGE_INTENT;
      setCandidates([]);
      setImageFieldKey(key => key + 1);
    }
    finally {
      setIsPending(false);
    }
  }

  return {
    imageFieldKey,
    isPending,
    isMutating: addImage.isPending || autoImage.isPending || imagesFromCandidates.isPending
      || setMainImage.isPending || deleteImageById.isPending || takeScreenshot.isPending
      || deleteScreenshot.isPending,
    mutationError: addImage.error ?? imagesFromCandidates.error ?? setMainImage.error
      ?? deleteImageById.error ?? autoImage.error,
    candidates,
    isScanning,
    onFindImages: () => void handleFindImages(),
    getPageImagePending: autoImage.isPending,
    onGetPageImage: () => autoImage.mutate({
      id: bookmark.id,
      sourceUrl: bookmark.url ?? "",
    }),
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
