import type {
  Bookmark,
  BookmarkFileValue,
  BookmarkImage,
  BookmarkUrlDuplicateResult,
  BookmarkUrlSummary,
  BulkBookmarkResult,
  BulkBookmarkTagOp,
  BulkUrlUpdate,
  BulkUrlUpdateResult,
  CreateBookmarkInput,
  TitleTagBackfillResult,
  UpdateBookmarkInput,
  UpdateBookmarkRelationshipsInput,
} from "@eesimple/types";

import { request, uploadImageFile } from "./client";

export const bookmarksApi = {
  queueToInbox: (url: string, title: string) =>
    request<{ id: string }>("/bookmarks/inbox", {
      method: "POST",
      body: JSON.stringify({
        url,
        title,
      }),
    }),
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
  bulkDelete: (ids: string[]) =>
    request<BulkBookmarkResult[]>("/bookmarks/bulk-delete", {
      method: "POST",
      body: JSON.stringify({
        ids,
      }),
    }),
  bulkUpdate: (ids: string[], patch: UpdateBookmarkInput) =>
    request<BulkBookmarkResult[]>("/bookmarks/bulk", {
      method: "POST",
      body: JSON.stringify({
        ids,
        patch,
      }),
    }),
  bulkTags: (ids: string[], tagIds: string[], op: BulkBookmarkTagOp) =>
    request<BulkBookmarkResult[]>("/bookmarks/bulk-tags", {
      method: "POST",
      body: JSON.stringify({
        ids,
        tagIds,
        op,
      }),
    }),
  backfillTitleTags: () =>
    request<TitleTagBackfillResult>("/bookmarks/backfill-title-tags", {
      method: "POST",
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
