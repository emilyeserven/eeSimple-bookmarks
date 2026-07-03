import type { TaxonomyImage } from "@eesimple/types";

import { request, uploadImageFile } from "./client";

/**
 * Image-gallery API for one Plex/Kavita-backed media taxonomy, mounted under `${basePath}/:id/images`
 * on the middleware. Mirrors the bookmark image endpoints, but scoped to a single entity's gallery.
 * `autoFetch` calls the given source-specific action path (e.g. `"plex-poster"`, `"kavita-cover"`).
 */
export function createTaxonomyImageApi(basePath: string) {
  return {
    list: (id: string) => request<TaxonomyImage[]>(`${basePath}/${id}/images`),
    upload: (id: string, file: File, main = false) =>
      uploadImageFile<TaxonomyImage>(`${basePath}/${id}/images${main ? "?main=true" : ""}`, file),
    autoFetch: (id: string, source: string) =>
      request<TaxonomyImage>(`${basePath}/${id}/images/${source}`, {
        method: "POST",
      }),
    setMain: (id: string, imageId: string) =>
      request<TaxonomyImage>(`${basePath}/${id}/images/${imageId}/main`, {
        method: "POST",
      }),
    remove: (id: string, imageId: string) =>
      request<undefined>(`${basePath}/${id}/images/${imageId}`, {
        method: "DELETE",
      }),
  };
}
