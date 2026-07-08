import type { ImageIntent } from "./bookmarkImageIntent";
import type { Bookmark, ImageCandidate, ImageDisplayPreference } from "@eesimple/types";

import { useRef, useState } from "react";

import { useTranslation } from "react-i18next";

import { ISBN_SLUG } from "./bookmarkFormSchema";
import { EMPTY_IMAGE_INTENT } from "./bookmarkImageIntent";
import { applyImageIntent } from "./bookmarkSubmit";
import { useBookmarkImageMutations } from "./useBookmarkImageMutations";
import { useScreenshotSettingsState } from "./useScreenshotSettingsState";
import { useBookmarkKavitaSeriesId, useBookmarkPlexRatingKey } from "../hooks/useBookmarkMediaLinks";
import { useConnectors } from "../hooks/useConnectors";
import { usePropertyBySlug } from "../hooks/useCustomProperties";
import { metadataApi } from "../lib/api/metadata";
import { notifySuccess } from "../lib/notifications";
import { selectIsBookmarkQueued, useScreenshotQueueStore } from "../stores/screenshotQueueStore";

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
  /** Whether the "Use Plex poster" action applies (connector enabled + bookmark linked to an item). */
  canUsePlexPoster: boolean;
  /** Whether the Plex poster import is in flight. */
  plexPosterPending: boolean;
  /** Import the linked Plex item's poster as the bookmark's main image. */
  onUsePlexPoster: () => void;
  /** Whether the "Pull cover from ISBN" action applies (bookmark has a non-empty ISBN/ASIN value). */
  canUseIsbnCover: boolean;
  /** Whether the ISBN cover import is in flight. */
  isbnCoverPending: boolean;
  /** Look up the bookmark's stored ISBN/ASIN and import its cover as the bookmark's main image. */
  onUseIsbnCover: () => void;
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
  /** Which image source the cover currently displays. */
  displayPreference: ImageDisplayPreference;
  /** Whether the display-preference save is in flight. */
  displayPreferencePending: boolean;
  /** Persist a new display preference. */
  onDisplayPreferenceChange: (preference: ImageDisplayPreference) => void;
}

/**
 * Owns the image-edit tab's mutation hooks, staged-intent ref, page-scan, and submit/screenshot
 * handlers, so the `BookmarkImageEditForm` component stays a thin JSX shell. The bookmark already
 * exists here, so a save applies the same multi-image {@link applyImageIntent} the create form uses.
 */
export function useBookmarkImageEditForm(bookmark: Bookmark): BookmarkImageEditFormController {
  const mutations = useBookmarkImageMutations();
  const {
    t,
  } = useTranslation();
  const {
    data: connectors,
  } = useConnectors();
  const kavitaSeriesId = useBookmarkKavitaSeriesId(bookmark);
  const plexRatingKey = useBookmarkPlexRatingKey(bookmark);
  const {
    property: isbnProperty,
  } = usePropertyBySlug(ISBN_SLUG);

  const imageIntentRef = useRef<ImageIntent>(EMPTY_IMAGE_INTENT);
  const [imageFieldKey, setImageFieldKey] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [candidates, setCandidates] = useState<ImageCandidate[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const screenshotSettings = useScreenshotSettingsState(bookmark.screenshotSettings);
  const enqueueScreenshot = useScreenshotQueueStore(state => state.enqueue);
  const screenshotQueued = useScreenshotQueueStore(selectIsBookmarkQueued(bookmark.id));

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
      await applyImageIntent(bookmark.id, bookmark.url ?? "", imageIntentRef.current, mutations);
      notifySuccess(t("Changes saved"));
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
    // A queued/in-flight capture for this bookmark disables the image controls too, matching the
    // prior behavior when the screenshot mutation was part of `mutations.isMutating`.
    isMutating: mutations.isMutating || screenshotQueued,
    mutationError: mutations.mutationError,
    candidates,
    isScanning,
    onFindImages: () => void handleFindImages(),
    getPageImagePending: mutations.autoImage.isPending,
    onGetPageImage: () => mutations.autoImage.mutate({
      id: bookmark.id,
      sourceUrl: bookmark.url ?? "",
    }),
    canUseKavitaCover: Boolean(connectors?.kavita.enabled) && kavitaSeriesId !== null,
    kavitaCoverPending: mutations.kavitaCover.isPending,
    onUseKavitaCover: () => mutations.kavitaCover.mutate(bookmark.id),
    canUsePlexPoster: Boolean(connectors?.plex.enabled) && plexRatingKey !== null,
    plexPosterPending: mutations.plexPoster.isPending,
    onUsePlexPoster: () => mutations.plexPoster.mutate(bookmark.id),
    canUseIsbnCover: Boolean(
      isbnProperty
      && bookmark.textValues.some(v => v.propertyId === isbnProperty.id && v.value.trim()),
    ),
    isbnCoverPending: mutations.isbnCover.isPending,
    onUseIsbnCover: () => mutations.isbnCover.mutate(bookmark.id),
    onImageChange: (intent) => {
      imageIntentRef.current = intent;
    },
    onSubmit: event => void handleSubmit(event),
    ...screenshotSettings,
    takeScreenshotPending: screenshotQueued,
    deleteScreenshotPending: mutations.deleteScreenshot.isPending,
    onTakeScreenshot: () => enqueueScreenshot({
      id: bookmark.id,
      delayMs: screenshotSettings.screenshotDelayMs || undefined,
      width: screenshotSettings.screenshotWidth,
      height: screenshotSettings.screenshotHeight,
      scrollDistance: screenshotSettings.screenshotScrollDistance || undefined,
    }),
    onDeleteScreenshot: () => void mutations.deleteScreenshot.mutateAsync(bookmark.id),
    displayPreference: bookmark.imageDisplayPreference,
    displayPreferencePending: mutations.updateDisplayPreference.isPending,
    onDisplayPreferenceChange: (preference) => {
      mutations.updateDisplayPreference.mutate({
        id: bookmark.id,
        input: {
          imageDisplayPreference: preference,
        },
      }, {
        onSuccess: () => notifySuccess(t("Updated cover image preference")),
      });
    },
  };
}
