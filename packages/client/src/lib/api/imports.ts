import type {
  ActiveImport,
  AutoFetchJobStatus,
  BlockImportItemInput,
  CreateNewsletterInput,
  DeleteOrphansResult,
  GalleryCatalog,
  GalleryScanResult,
  Import,
  ImportApproveResult,
  ImportItem,
  ImportSummary,
  InboxItem,
  InboxPreFillDefaults,
  IngestPasteInput,
  IngestUrlInput,
  Newsletter,
  OrphanCounts,
  OrphanDeleteResult,
  PurgeImportItemsResult,
  RecheckPendingItemsResult,
  RejectPendingItemsResult,
  UpdateImportItemInput,
  UpdateNewsletterInput,
  BookmarkImage,
} from "@eesimple/types";

import { createCrudApi, request, uploadImageFile } from "./client";

export const importApi = {
  ingestPaste: (input: IngestPasteInput) =>
    request<Import>("/imports/ingest/paste", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  ingestUrl: (input: IngestUrlInput) =>
    request<Import>("/imports/ingest/url", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  ingestUpload: (
    file: File,
    newsletterId?: string | null,
    defaultCategoryId?: string | null,
  ) => {
    const params = new URLSearchParams();
    if (newsletterId) params.set("newsletterId", newsletterId);
    if (defaultCategoryId) params.set("defaultCategoryId", defaultCategoryId);
    const qs = params.toString();
    return uploadImageFile<Import>(`/imports/ingest/upload${qs ? `?${qs}` : ""}`, file);
  },
  listImports: () => request<ImportSummary[]>("/imports"),
  /** Imports currently in flight (queued/processing) with live progress, for the header indicator. */
  listActive: () => request<ActiveImport[]>("/imports/active"),
  getImport: (id: string) => request<Import>(`/imports/${id}`),
  /** All import items across all imports, for the Inbox review queue. */
  listInboxItems: () => request<InboxItem[]>("/imports/items"),
  listIssues: (newsletterId: string) =>
    request<ImportSummary[]>(`/newsletters/${newsletterId}/issues`),
  addIssueBookmarks: (importId: string, bookmarkIds: string[]) =>
    request<undefined>(`/imports/${importId}/bookmarks`, {
      method: "POST",
      body: JSON.stringify({
        bookmarkIds,
      }),
    }),
  removeIssueBookmarks: (importId: string, bookmarkIds: string[]) =>
    request<undefined>(`/imports/${importId}/bookmarks`, {
      method: "DELETE",
      body: JSON.stringify({
        bookmarkIds,
      }),
    }),
  updateItem: (itemId: string, input: UpdateImportItemInput) =>
    request<ImportItem>(`/imports/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  approveItem: (itemId: string, preFill?: InboxPreFillDefaults) =>
    request<ImportApproveResult>(`/imports/items/${itemId}/approve`, {
      method: "POST",
      ...(preFill
        ? {
          body: JSON.stringify({
            preFill,
          }),
        }
        : {}),
    }),
  approveImport: (importId: string) =>
    request<ImportApproveResult[]>(`/imports/${importId}/approve`, {
      method: "POST",
    }),
  rejectItem: (itemId: string) =>
    request<undefined>(`/imports/items/${itemId}/reject`, {
      method: "POST",
    }),
  /** Restore a rejected candidate to pending for re-review. */
  unrejectItem: (itemId: string) =>
    request<undefined>(`/imports/items/${itemId}/unreject`, {
      method: "POST",
    }),
  blockItem: (itemId: string, entry: BlockImportItemInput) =>
    request<ImportItem>(`/imports/items/${itemId}/block`, {
      method: "POST",
      body: JSON.stringify(entry),
    }),
  deleteImport: (id: string) =>
    request<undefined>(`/imports/${id}`, {
      method: "DELETE",
    }),
  /** Delete every processed item (approved/marked-for-deletion + blocked). Keeps the blacklist. */
  purgeProcessed: () =>
    request<PurgeImportItemsResult>("/imports/items/processed", {
      method: "DELETE",
    }),
  /** Reject every pending candidate across all imports (the Inbox "reject all pending" action). */
  rejectPending: () =>
    request<RejectPendingItemsResult>("/imports/items/pending/reject", {
      method: "POST",
    }),
  /** Re-check every pending candidate against the block list, blocking the matches. */
  recheckPending: () =>
    request<RecheckPendingItemsResult>("/imports/items/pending/recheck", {
      method: "POST",
    }),
  /** Delete every rejected candidate across all imports (the Inbox "delete all rejected" action). */
  deleteRejected: () =>
    request<PurgeImportItemsResult>("/imports/items/rejected", {
      method: "DELETE",
    }),
  /** Delete every approved (marked-for-deletion) item. Keeps blocked items. */
  deleteAdded: () =>
    request<PurgeImportItemsResult>("/imports/items/added", {
      method: "DELETE",
    }),
  /** Delete every blocked item. The Imports Blacklist is left untouched. */
  deleteBlocked: () =>
    request<PurgeImportItemsResult>("/imports/items/blocked", {
      method: "DELETE",
    }),
  /** Re-run redirect unwrap for a single item's rawUrl. */
  recheckItemUrl: (itemId: string) =>
    request<{ url: string | null;
      updated: boolean; }>(`/imports/items/${itemId}/recheck-url`, {
      method: "POST",
    }),
};

/** Housekeeping: report and sweep orphaned records (bookmarks with no category, newsletter-less inbox items). */
export const maintenanceApi = {
  getOrphanCounts: () => request<OrphanCounts>("/maintenance/orphans"),
  deleteOrphanBookmarks: () =>
    request<OrphanDeleteResult>("/maintenance/orphan-bookmarks", {
      method: "DELETE",
    }),
  deleteOrphanInboxItems: () =>
    request<OrphanDeleteResult>("/maintenance/orphan-inbox-items", {
      method: "DELETE",
    }),
};

export const newslettersApi = createCrudApi<Newsletter, CreateNewsletterInput, UpdateNewsletterInput>("newsletters");

export const galleryApi = {
  list: () => request<GalleryCatalog>("/gallery"),
  scan: () => request<GalleryScanResult>("/gallery/scan", {
    method: "POST",
  }),
  deleteOrphans: (keys: string[]) =>
    request<DeleteOrphansResult>("/gallery/orphans", {
      method: "DELETE",
      body: JSON.stringify({
        keys,
      }),
    }),
  attach: (key: string, bookmarkId: string) =>
    request<BookmarkImage>("/gallery/attach", {
      method: "POST",
      body: JSON.stringify({
        key,
        bookmarkId,
      }),
    }),
  autoFetch: () =>
    request<AutoFetchJobStatus>("/gallery/auto-fetch", {
      method: "POST",
    }),
  autoFetchStatus: () => request<AutoFetchJobStatus>("/gallery/auto-fetch/status"),
};
