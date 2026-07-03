import type { createTaxonomyImageApi } from "../lib/api/taxonomyImages";

import { Clapperboard } from "lucide-react";

import { TaxonomyImageGallery } from "./TaxonomyImageGallery";
import { useConnectors } from "../hooks/useConnectors";
import { useTaxonomyImages } from "../hooks/useTaxonomyImages";

interface PlexTaxonomyEntity {
  id: string;
  plexRatingKey: string | null;
}

interface PlexTaxonomyImageTabProps<E extends PlexTaxonomyEntity> {
  entity: E;
  imagesApi: ReturnType<typeof createTaxonomyImageApi>;
  /** Cache-key prefix, unique per entity kind (e.g. `"movie-images"`). */
  queryKeyPrefix: string;
  readOnly?: boolean;
}

/**
 * Image tab body shared by every Plex-backed media taxonomy (Movies, TV Shows, Episodes, Artists,
 * Albums, Tracks): a multi-image gallery with a "Use Plex poster" auto-fetch action, gated on the
 * Plex connector being enabled and the entity itself being linked to a Plex item.
 */
export function PlexTaxonomyImageTab<E extends PlexTaxonomyEntity>({
  entity,
  imagesApi,
  queryKeyPrefix,
  readOnly = false,
}: PlexTaxonomyImageTabProps<E>) {
  const {
    data: connectors,
  } = useConnectors();
  const gallery = useTaxonomyImages(imagesApi, entity.id, [queryKeyPrefix, entity.id]);

  return (
    <TaxonomyImageGallery
      images={gallery.images}
      isLoading={gallery.isLoading}
      readOnly={readOnly}
      autoFetchActions={[
        {
          source: "plex-poster",
          label: "Use Plex poster",
          icon: Clapperboard,
          enabled: Boolean(connectors?.plex.enabled) && entity.plexRatingKey !== null,
        },
      ]}
      pendingAutoFetchSource={gallery.autoFetch.isPending ? gallery.autoFetch.variables : null}
      onUpload={file => gallery.upload.mutate(file)}
      uploadPending={gallery.upload.isPending}
      onAutoFetch={source => gallery.autoFetch.mutate(source)}
      onSetMain={imageId => gallery.setMain.mutate(imageId)}
      setMainPending={gallery.setMain.isPending}
      onRemove={imageId => gallery.remove.mutate(imageId)}
      removePending={gallery.remove.isPending}
    />
  );
}
