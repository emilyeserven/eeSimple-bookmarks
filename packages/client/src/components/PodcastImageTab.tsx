import type { Podcast } from "@eesimple/types";

import { Rss } from "lucide-react";

import { TaxonomyImageGallery } from "./TaxonomyImageGallery";
import { useTaxonomyImages } from "../hooks/useTaxonomyImages";
import { podcastsApi } from "../lib/api/taxonomies";

/**
 * Image tab body for the Podcasts taxonomy: a multi-image gallery with a single "Import artwork"
 * auto-fetch action that pulls the show artwork from the podcast's feed. Mirrors the single-source
 * `MovieImageTab` (Plex poster), but keyless — gated only on the podcast having a feed URL.
 */
export function PodcastImageTab({
  podcast,
  readOnly = false,
}: {
  podcast: Podcast;
  readOnly?: boolean;
}) {
  const gallery = useTaxonomyImages(podcastsApi.images, podcast.id, ["podcast-images", podcast.id]);

  return (
    <TaxonomyImageGallery
      images={gallery.images}
      isLoading={gallery.isLoading}
      readOnly={readOnly}
      autoFetchActions={[
        {
          source: "artwork",
          label: "Import artwork",
          icon: Rss,
          enabled: Boolean(podcast.feedUrl?.trim()),
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
