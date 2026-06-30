import type { ImageIntent } from "./bookmarkImageIntent";
import type { ImageCandidate } from "@eesimple/types";

import { useRef, useState } from "react";

import { initialImageIntent } from "./bookmarkFormSchema";

interface UseBookmarkFormImageStateParams {
  isEdit: boolean;
  autoFetchImage: boolean;
}

/**
 * Image-intent and quick-add state for the bookmark form. Owns the `imageIntentRef` (the
 * ImageControl's declared intent applied after save), `imageFieldKey` (remount key to
 * clear the field on reset), and `quickAddRef` (the "Add Now" flag that bypasses
 * shortened-link expansion). Extracted from `useBookmarkFormController` to reduce that
 * hook's hook-density score.
 */
export function useBookmarkFormImageState({
  isEdit, autoFetchImage,
}: UseBookmarkFormImageStateParams) {
  // The image control reports its intent here; the form applies it after the bookmark is saved.
  // `imageFieldKey` remounts the field to clear it on reset.
  const imageIntentRef = useRef<ImageIntent>(
    initialImageIntent(!isEdit && autoFetchImage),
  );
  const [imageFieldKey, setImageFieldKey] = useState(0);
  // Candidate images discovered by the latest URL scan — fed to the image picker so the user can keep
  // several (e.g. all of an Instagram carousel) and choose the main one.
  const [imageCandidates, setImageCandidates] = useState<ImageCandidate[]>([]);

  // Set by the "Add Now" quick path so the submit handler saves the URL exactly as typed (no
  // shortened-link expansion). Read by the (stale) submit closure.
  const quickAddRef = useRef(false);

  function resetImageState(): void {
    imageIntentRef.current = initialImageIntent(autoFetchImage);
    setImageFieldKey(key => key + 1);
    setImageCandidates([]);
    quickAddRef.current = false;
  }

  return {
    imageIntentRef,
    imageFieldKey,
    setImageFieldKey,
    imageCandidates,
    setImageCandidates,
    quickAddRef,
    resetImageState,
  };
}
