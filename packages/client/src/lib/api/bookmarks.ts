import type {
  Bookmark,
  BookmarkFileValue,
  BookmarkImage,
  BookmarkUrlDuplicateResult,
  BookmarkUrlSummary,
  BulkUrlUpdate,
  BulkUrlUpdateResult,
  CreateBookmarkInput,
  UpdateBookmarkInput,
  UpdateBookmarkRelationshipsInput,
} from "@eesimple/types";

import { request, uploadImageFile } from "./client";

export const bookmarksApi = {
  list: (tagIds?: string[]) => {
    const params = new URLSearchParams();
    for (const id of tagIds ?? []) params.append("tags", id);
    const qs = params.toString();
    return request<Bookmark[]>(`/bookmarks${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => request<Bookmark>(`/bookmarks/${id}`),
  create: (input: CreateBookmarkInput) =>
    request<Bookmark>("/bookmarks", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdateBookmarkInput) =>
    request<Bookmark>(`/bookmarks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/bookmarks/${id}`, {
    method: "DELETE",
  }),
  onHost: (domain: string) =>
    request<BookmarkUrlSummary[]>(`/bookmarks/on-host?domain=${encodeURIComponent(domain)}`),
  bulkUrl: (items: BulkUrlUpdate[]) =>
    request<BulkUrlUpdateResult[]>("/bookmarks/bulk-url", {
      method: "POST",
      body: JSON.stringify({
        items,
      }),
    }),
  urlCheck: (url: string) =>
    request<BookmarkUrlDuplicateResult>(
      `/bookmarks/url-check?url=${encodeURIComponent(url)}`,
    ),
  uploadImage: (id: string, file: File) =>
    uploadImageFile<BookmarkImage>(`/bookmarks/${id}/image`, file),
  autoImage: (id: string) =>
    request<BookmarkImage>(`/bookmarks/${id}/image/auto`, {
      method: "POST",
    }),
  deleteImage: (id: string) =>
    request<undefined>(`/bookmarks/${id}/image`, {
      method: "DELETE",
    }),
  uploadPropertyFile: (id: string, propertyId: string, file: File) =>
    uploadImageFile<BookmarkFileValue>(`/bookmarks/${id}/properties/${propertyId}/file`, file),
  deletePropertyFile: (id: string, propertyId: string) =>
    request<undefined>(`/bookmarks/${id}/properties/${propertyId}/file`, {
      method: "DELETE",
    }),
  updateRelationships: (id: string, input: UpdateBookmarkRelationshipsInput) =>
    request<Bookmark>(`/bookmarks/${id}/relationships`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
};
