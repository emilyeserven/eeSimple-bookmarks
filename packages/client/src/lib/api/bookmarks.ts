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
  ReelArchiveJob,
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
  backfillTitleLocations: () =>
    request<TitleTagBackfillResult>("/bookmarks/backfill-title-locations", {
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
  kavitaCover: (id: string) =>
    request<BookmarkImage>(`/bookmarks/${id}/kavita-cover`, {
      method: "POST",
    }),
  isbnCover: (id: string) =>
    request<BookmarkImage>(`/bookmarks/${id}/isbn-cover`, {
      method: "POST",
    }),
  deleteImage: (id: string) =>
    request<undefined>(`/bookmarks/${id}/image`, {
      method: "DELETE",
    }),
  // Multi-image: add one image (keeping the others), capture kept scan candidates, set the main, delete one.
  addImage: (id: string, file: File, main = false) =>
    uploadImageFile<BookmarkImage>(`/bookmarks/${id}/images${main ? "?main=true" : ""}`, file),
  imagesFromCandidates: (id: string, urls: string[], mainUrl?: string | null) =>
    request<BookmarkImage[]>(`/bookmarks/${id}/images/from-candidates`, {
      method: "POST",
      body: JSON.stringify({
        urls,
        ...(mainUrl != null && {
          mainUrl,
        }),
      }),
    }),
  setMainImage: (id: string, imageId: string) =>
    request<BookmarkImage>(`/bookmarks/${id}/images/${imageId}/main`, {
      method: "POST",
    }),
  deleteImageById: (id: string, imageId: string) =>
    request<undefined>(`/bookmarks/${id}/images/${imageId}`, {
      method: "DELETE",
    }),
  takeScreenshot: (id: string, delayMs?: number, width?: number, height?: number, scrollDistance?: number) =>
    request<BookmarkImage>(`/bookmarks/${id}/screenshot`, {
      method: "POST",
      body: JSON.stringify({
        ...(delayMs != null && {
          delayMs,
        }),
        ...(width != null && {
          width,
        }),
        ...(height != null && {
          height,
        }),
        ...(scrollDistance != null && {
          scrollDistance,
        }),
      }),
    }),
  deleteScreenshot: (id: string) =>
    request<undefined>(`/bookmarks/${id}/screenshot`, {
      method: "DELETE",
    }),
  archiveReel: (id: string) =>
    request<ReelArchiveJob>(`/bookmarks/${id}/reel-archive`, {
      method: "POST",
    }),
  deleteReelArchive: (id: string) =>
    request<undefined>(`/bookmarks/${id}/reel-archive`, {
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
