import type { SyncFieldDiff, SyncProvider } from "../lib/syncSources/syncSourceTypes";

import { useCallback, useMemo, useRef } from "react";

import { useRegisterSyncProvider } from "./useRegisterSyncProvider";

/** Which preview endpoint the modal's fetch hook uses for this taxonomy. */
export type ImageTaxonomyPreviewKind = "youtube" | "website" | "person" | "plex";

interface ImageTaxonomySyncRegistrationParams {
  entityId: string;
  /** Entity name shown in the modal title. */
  entityLabel: string;
  /** Source name shown as the diff group heading, e.g. "YouTube", "Website", "Instagram", "Plex". */
  sourceLabel: string;
  previewKind: ImageTaxonomyPreviewKind;
  /** The entity's current main image URL, for the "current" preview. */
  currentImageUrl: string | null;
  /** Plex only: the linked item's rating key (drives the poster proxy URL). Null → no row offered. */
  plexRatingKey?: string | null;
  /** Person only: which stored URL to resolve the avatar from. */
  personSource?: "website" | "biography" | "social";
  /** Person only: platform for a social-source avatar. */
  personPlatform?: string | null;
  /**
   * Applies the source image immediately (the caller's existing auto-fetch / import mutation). Image
   * sources store on apply — they can't be staged into a form field. `null` when the source isn't
   * currently available (e.g. connector disabled), which also hides the button.
   */
  applyImage: (() => void) | null;
}

/**
 * Registers an image-only taxonomy's {@link SyncProvider} so the header Sync button can preview and
 * re-pull its source image (YouTube avatar / website favicon / person avatar / Plex poster). The
 * modal shows current-vs-source thumbnails; on Apply the selected image row fires the caller's
 * existing auto-fetch mutation. Pass `applyImage: null` when the source is unavailable so nothing
 * registers and the button stays hidden.
 */
export function useImageTaxonomySyncRegistration(params: ImageTaxonomySyncRegistrationParams) {
  const ctxRef = useRef<ImageTaxonomySyncRegistrationParams>(params);
  ctxRef.current = params;

  const applyStaged = useCallback((selected: SyncFieldDiff[]) => {
    if (selected.length === 0) return;
    ctxRef.current.applyImage?.();
  }, []);

  const {
    entityId, entityLabel, sourceLabel, previewKind, currentImageUrl,
    plexRatingKey, personSource, personPlatform, applyImage,
  } = params;
  // Depend on whether an apply callback exists, not its identity — `applyStaged` reads the latest
  // one via `ctxRef`, so an inline-arrow `applyImage` mustn't rebuild the provider every render.
  const canApply = applyImage != null;

  const provider = useMemo<SyncProvider | null>(() => {
    if (!canApply) return null;
    return {
      descriptorKind: "image-taxonomy",
      entityLabel,
      entityId,
      refs: {
        previewKind,
        sourceLabel,
        currentImageUrl: currentImageUrl ?? null,
        plexRatingKey: plexRatingKey ?? null,
        personSource: personSource ?? null,
        personPlatform: personPlatform ?? null,
      },
      applyStaged,
    };
  }, [
    entityId, entityLabel, sourceLabel, previewKind, currentImageUrl,
    plexRatingKey, personSource, personPlatform, canApply, applyStaged,
  ]);

  useRegisterSyncProvider(provider);
}
