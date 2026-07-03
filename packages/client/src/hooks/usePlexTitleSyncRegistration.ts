import type { createTaxonomyImageApi } from "../lib/api/taxonomyImages";
import type { PlexTitleSyncField } from "../lib/syncSources/plexTitleDiff";
import type { SyncFieldDiff, SyncProvider } from "../lib/syncSources/syncSourceTypes";

import { useCallback, useMemo, useRef } from "react";

import { useConnectors } from "./useConnectors";
import { useRegisterSyncProvider } from "./useRegisterSyncProvider";
import { useTaxonomyImages } from "./useTaxonomyImages";

/** The `{ field, value }` a Plex-title text diff row carries in its `payload`. */
interface PlexTitlePayload {
  field: PlexTitleSyncField;
  value: string;
}

/** The subset of a Plex-backed taxonomy row this hook reads (kept structural to avoid a component cycle). */
interface PlexTitleSyncEntity {
  id: string;
  name: string;
  plexRatingKey: string | null;
  romanizedName?: string | null;
  wikipediaLinkEn?: string | null;
  wikipediaLinkLocal?: string | null;
}

interface PlexTitleSyncRegistrationParams {
  entity: PlexTitleSyncEntity;
  /** REST base path segment for the preview endpoint, e.g. `"movies"` / `"tv-shows"`. */
  base: string;
  imagesApi: ReturnType<typeof createTaxonomyImageApi>;
  /** Image-gallery cache-key prefix, e.g. `"movie-images"`. */
  queryKeyPrefix: string;
  /** Stage a text field into the edit form + persist it via the form's per-field auto-save. */
  applyText: (field: PlexTitleSyncField, value: string) => void;
}

/**
 * Registers a Plex-backed taxonomy edit form's {@link SyncProvider} so the header Sync button can
 * re-pull from Plex + Wikidata: the modal reviews the native/romanized names + Wikipedia links (staged
 * into the form on Apply) and the Plex poster (imported immediately via the taxonomy image gallery's
 * `plex-poster` auto-fetch). Registers only while the Plex connector is on and the row is linked, so the
 * button stays hidden otherwise. Kept out of `PlexTitleGeneralForm` so that component's hook-density
 * stays under the fallow cap.
 */
export function usePlexTitleSyncRegistration({
  entity, base, imagesApi, queryKeyPrefix, applyText,
}: PlexTitleSyncRegistrationParams) {
  const {
    data: connectors,
  } = useConnectors();
  const gallery = useTaxonomyImages(imagesApi, entity.id, [queryKeyPrefix, entity.id]);
  const currentImageUrl = (gallery.images.find(image => image.isMain) ?? gallery.images[0])?.url ?? null;
  const enabled = Boolean(connectors?.plex.enabled) && entity.plexRatingKey !== null;

  // Latest deps behind a ref so `applyStaged` (and thus the provider) stays referentially stable —
  // otherwise the register-on-mount effect would thrash the store every render.
  const ctxRef = useRef({
    applyText,
    autoFetch: gallery.autoFetch,
  });
  ctxRef.current = {
    applyText,
    autoFetch: gallery.autoFetch,
  };

  const applyStaged = useCallback((selected: SyncFieldDiff[]) => {
    for (const row of selected) {
      if (row.key === "poster") {
        ctxRef.current.autoFetch.mutate("plex-poster");
        continue;
      }
      const payload = row.payload as PlexTitlePayload | undefined;
      if (payload) ctxRef.current.applyText(payload.field, payload.value);
    }
  }, []);

  const provider = useMemo<SyncProvider | null>(() => {
    if (!enabled) return null;
    return {
      descriptorKind: "plex-title",
      entityLabel: entity.name,
      entityId: entity.id,
      refs: {
        base,
        sourceLabel: "Plex",
        plexRatingKey: entity.plexRatingKey,
        currentImageUrl,
        currentName: entity.name,
        currentRomanizedName: entity.romanizedName ?? null,
        currentWikipediaLinkEn: entity.wikipediaLinkEn ?? null,
        currentWikipediaLinkLocal: entity.wikipediaLinkLocal ?? null,
      },
      applyStaged,
    };
  }, [
    entity.id, entity.name, entity.plexRatingKey, entity.romanizedName,
    entity.wikipediaLinkEn, entity.wikipediaLinkLocal, base, currentImageUrl, enabled, applyStaged,
  ]);

  useRegisterSyncProvider(provider);
}
