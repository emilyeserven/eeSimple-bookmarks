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
  useKavitaCoverImage,
  useSetMainBookmarkImage,
  useTakeBookmarkScreenshot,
} from "../hooks/useBookmarks";
import { useConnectors } from "../hooks/useConnectors";
import { metadataApi } from "../lib/api/metadata";
import { notifySuccess } from "../lib/notifications";

/** Common Browserless screenshot viewport sizes offered in the size picker. */
export const SCREENSHOT_SIZE_PRESETS = [
  {
    width: 1280,
    height: 720,
    label: "1280 × 720 (16:9)",
  },
  {
    width: 1920,
    height: 1080,
    label: "1920 × 1080 (16:9)",
  },
  {
    width: 1024,
    height: 768,
    label: "1024 × 768 (4:3)",
  },
  {
    width: 800,
    height: 600,
    label: "800 × 600 (4:3)",
  },
] as const;

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
  /** Whether the "Use Kavita cover" action applies (connector enabled + bookmark linked to a series). */
  canUseKavitaCover: boolean;
  /** Whether the Kavita cover import is in flight. */
  kavitaCoverPending: boolean;
  /** Import the linked Kavita series' cover as the bookmark's main image. */
  onUseKavitaCover: () => void;
  /** Stage the chosen image intent (uploads / kept candidates / main / removals) for the next save. */
  onImageChange: (intent: ImageIntent) => void;
  /** Persist the staged image intent. */
  onSubmit: (event: React.FormEvent) => void;
  screenshotDelayMs: number;
  setScreenshotDelayMs: (ms: number) => void;
  screenshotWidth: number;
  screenshotHeight: number;
  setScreenshotSize: (width: number, height: number) => void;
  screenshotScrollDistance: number;
  setScreenshotScrollDistance: (px: number) => void;
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
  const kavitaCover = useKavitaCoverImage();
  const {
    data: connectors,
  } = useConnectors();
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
  const [screenshotWidth, setScreenshotWidth] = useState<number>(SCREENSHOT_SIZE_PRESETS[0].width);
  const [screenshotHeight, setScreenshotHeight] = useState<number>(SCREENSHOT_SIZE_PRESETS[0].height);
  const [screenshotScrollDistance, setScreenshotScrollDistance] = useState(0);

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
    isMutating: addImage.isPending || autoImage.isPending || kavitaCover.isPending
      || imagesFromCandidates.isPending
      || setMainImage.isPending || deleteImageById.isPending || takeScreenshot.isPending
      || deleteScreenshot.isPending,
    mutationError: addImage.error ?? imagesFromCandidates.error ?? setMainImage.error
      ?? deleteImageById.error ?? autoImage.error ?? kavitaCover.error,
    candidates,
    isScanning,
    onFindImages: () => void handleFindImages(),
    getPageImagePending: autoImage.isPending,
    onGetPageImage: () => autoImage.mutate({
      id: bookmark.id,
      sourceUrl: bookmark.url ?? "",
    }),
    canUseKavitaCover: Boolean(connectors?.kavita.enabled) && bookmark.kavitaSeriesId !== null,
    kavitaCoverPending: kavitaCover.isPending,
    onUseKavitaCover: () => kavitaCover.mutate(bookmark.id),
    onImageChange: (intent) => {
      imageIntentRef.current = intent;
    },
    onSubmit: event => void handleSubmit(event),
    screenshotDelayMs,
    setScreenshotDelayMs,
    screenshotWidth,
    screenshotHeight,
    setScreenshotSize: (width, height) => {
      setScreenshotWidth(width);
      setScreenshotHeight(height);
    },
    screenshotScrollDistance,
    setScreenshotScrollDistance,
    takeScreenshotPending: takeScreenshot.isPending,
    deleteScreenshotPending: deleteScreenshot.isPending,
    onTakeScreenshot: () => void takeScreenshot.mutateAsync({
      id: bookmark.id,
      delayMs: screenshotDelayMs || undefined,
      width: screenshotWidth,
      height: screenshotHeight,
      scrollDistance: screenshotScrollDistance || undefined,
    }),
    onDeleteScreenshot: () => void deleteScreenshot.mutateAsync(bookmark.id),
  };
}
