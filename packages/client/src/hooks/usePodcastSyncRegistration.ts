import type { createTaxonomyImageApi } from "../lib/api/taxonomyImages";
import type { PodcastLinkSyncField, PodcastSyncField } from "../lib/syncSources/podcastDiff";
import type { SyncFieldDiff, SyncProvider } from "../lib/syncSources/syncSourceTypes";
import type { Podcast } from "@eesimple/types";

import { useCallback, useMemo, useRef } from "react";

import { useRegisterSyncProvider } from "./useRegisterSyncProvider";
import { useTaxonomyImages } from "./useTaxonomyImages";

/** The `{ field, value }` a podcast diff row carries in its `payload`; `isLink` marks a service-link row. */
interface PodcastPayload {
  field: PodcastSyncField | PodcastLinkSyncField;
  value: string;
  isLink?: boolean;
}

interface PodcastSyncRegistrationParams {
  podcast: Podcast;
  imagesApi: ReturnType<typeof createTaxonomyImageApi>;
  /** Stage a text field into the edit form + persist it via the form's per-field auto-save. */
  applyText: (field: PodcastSyncField, value: string) => void;
  /** Persist a cross-resolved service-link URL directly (not a form field). */
  applyLink: (field: PodcastLinkSyncField, value: string) => void;
}

/**
 * Registers the podcast edit form's {@link SyncProvider} so the header Sync button can re-pull from the
 * RSS feed / Apple Podcasts: the modal reviews the name/author/description (staged into the form on
 * Apply, persisted by its per-field auto-save) and the artwork (imported immediately via the taxonomy
 * image gallery's `artwork` auto-fetch). Keyless — registers whenever the podcast has a feed URL or an
 * iTunes id, so the button stays hidden until there's a source to sync from. Kept out of
 * `PodcastGeneralForm` so that component's hook-density stays under the fallow cap.
 */
export function usePodcastSyncRegistration({
  podcast, imagesApi, applyText, applyLink,
}: PodcastSyncRegistrationParams) {
  const gallery = useTaxonomyImages(imagesApi, podcast.id, ["podcast-images", podcast.id]);
  const currentImageUrl = (gallery.images.find(image => image.isMain) ?? gallery.images[0])?.url ?? null;
  const enabled = podcast.feedUrl !== null || podcast.itunesId !== null;

  // Latest deps behind a ref so `applyStaged` (and thus the provider) stays referentially stable —
  // otherwise the register-on-mount effect would thrash the store every render.
  const ctxRef = useRef({
    applyText,
    applyLink,
    autoFetch: gallery.autoFetch,
  });
  ctxRef.current = {
    applyText,
    applyLink,
    autoFetch: gallery.autoFetch,
  };

  const applyStaged = useCallback((selected: SyncFieldDiff[]) => {
    for (const row of selected) {
      if (row.key === "artwork") {
        ctxRef.current.autoFetch.mutate("artwork");
        continue;
      }
      const payload = row.payload as PodcastPayload | undefined;
      if (!payload) continue;
      if (payload.isLink) ctxRef.current.applyLink(payload.field as PodcastLinkSyncField, payload.value);
      else ctxRef.current.applyText(payload.field as PodcastSyncField, payload.value);
    }
  }, []);

  const provider = useMemo<SyncProvider | null>(() => {
    if (!enabled) return null;
    return {
      descriptorKind: "podcast-feed",
      entityLabel: podcast.name,
      entityId: podcast.id,
      refs: {
        currentImageUrl,
        currentName: podcast.name,
        currentAuthor: podcast.author ?? null,
        currentDescription: podcast.description ?? null,
        currentItunesUrl: podcast.itunesUrl ?? null,
        currentPocketCastsUrl: podcast.pocketCastsUrl ?? null,
      },
      applyStaged,
    };
  }, [
    podcast.id, podcast.name, podcast.author, podcast.description,
    podcast.itunesUrl, podcast.pocketCastsUrl,
    currentImageUrl, enabled, applyStaged,
  ]);

  useRegisterSyncProvider(provider);
}
