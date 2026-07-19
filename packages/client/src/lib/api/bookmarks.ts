import type {
  Bookmark,
  BookmarkFileValue,
  BookmarkIdentityCheckInput,
  BookmarkSearchRequest,
  BookmarkSearchResult,
  BookmarkImage,
  BookmarkUrlDuplicateResult,
  BookmarkUrlSummary,
  BulkBookmarkResult,
  BulkBookmarkTagOp,
  BulkUrlUpdate,
  BulkUrlUpdateResult,
  CreateBookmarkInput,
  PodcastFeedResult,
  ReelArchiveJob,
  TitleTagBackfillResult,
  UpdateBookmarkInput,
  UpdateBookmarkRelationshipsInput,
} from "@eesimple/types";

import { request, uploadImageFile } from "./client";

/** The resolved Wikidata metadata returned by `GET /bookmarks/:id/plex-metadata-preview`. */
export interface PlexMetadataPreview {
  name: string | null;
  englishName: string | null;
  wikipediaLinkEn: string | null;
  wikipediaLinkLocal: string | null;
}

/** The bookmark array fields the server always hydrates to `[]` (see `bookmarkHydration.ts`). */
type BookmarkArrayField
  = | "images"
    | "languageUsages"
    | "tags"
    | "locations"
    | "blacklistedTagIds"
    | "blacklistedLocationIds"
    | "people"
    | "groups"
    | "genreMoods"
    | "numberValues"
    | "booleanValues"
    | "dateTimeValues"
    | "choicesValues"
    | "progressValues"
    | "sectionsValues"
    | "textValues"
    | "fileValues"
    | "relationships";

/** A wire payload that may predate one of the array fields (e.g. a stale/version-skewed API). */
type RawBookmark = Omit<Bookmark, BookmarkArrayField> & Partial<Pick<Bookmark, BookmarkArrayField>>;

/**
 * Coerce every array field to `[]` when a payload omits it, so a stale or version-skewed API (or a
 * future added array field) degrades gracefully instead of crashing an unguarded `.length`/`.map`
 * read downstream. Mirrors the server's `?? []` hydration contract.
 */
export function normalizeBookmark(raw: RawBookmark): Bookmark {
  return {
    ...raw,
    images: raw.images ?? [],
    languageUsages: raw.languageUsages ?? [],
    tags: raw.tags ?? [],
    locations: raw.locations ?? [],
    blacklistedTagIds: raw.blacklistedTagIds ?? [],
    blacklistedLocationIds: raw.blacklistedLocationIds ?? [],
    people: raw.people ?? [],
    groups: raw.groups ?? [],
    genreMoods: raw.genreMoods ?? [],
    numberValues: raw.numberValues ?? [],
    booleanValues: raw.booleanValues ?? [],
    dateTimeValues: raw.dateTimeValues ?? [],
    choicesValues: raw.choicesValues ?? [],
    progressValues: raw.progressValues ?? [],
    sectionsValues: raw.sectionsValues ?? [],
    textValues: raw.textValues ?? [],
    fileValues: raw.fileValues ?? [],
    relationships: raw.relationships ?? [],
  };
}

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
    return request<Bookmark[]>(`/bookmarks${qs ? `?${qs}` : ""}`).then(rows => rows.map(normalizeBookmark));
  },
  search: (input: BookmarkSearchRequest) =>
    request<BookmarkSearchResult>("/bookmarks/search", {
      method: "POST",
      body: JSON.stringify(input),
    }).then(result => ({
      ...result,
      bookmarks: result.bookmarks.map(normalizeBookmark),
    })),
  get: (id: string) => request<Bookmark>(`/bookmarks/${id}`).then(normalizeBookmark),
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
  urlCheck: (url?: string, identity?: BookmarkIdentityCheckInput) => {
    const params = new URLSearchParams();
    if (url) params.set("url", url);
    if (identity?.isbn) params.set("isbn", identity.isbn);
    if (identity?.plexRatingKey) params.set("plexRatingKey", identity.plexRatingKey);
    if (identity?.kavitaSeriesId != null) params.set("kavitaSeriesId", String(identity.kavitaSeriesId));
    if (identity?.feedUrl) params.set("feedUrl", identity.feedUrl);
    return request<BookmarkUrlDuplicateResult>(`/bookmarks/url-check?${params.toString()}`);
  },
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
  plexPoster: (id: string) =>
    request<BookmarkImage>(`/bookmarks/${id}/plex-poster`, {
      method: "POST",
    }),
  isbnCover: (id: string) =>
    request<BookmarkImage>(`/bookmarks/${id}/isbn-cover`, {
      method: "POST",
    }),
  podcastArtwork: (id: string) =>
    request<BookmarkImage>(`/bookmarks/${id}/podcast-artwork`, {
      method: "POST",
    }),
  plexMetadataPreview: (id: string) =>
    request<PlexMetadataPreview>(`/bookmarks/${id}/plex-metadata-preview`),
  feedPreview: (id: string) =>
    request<PodcastFeedResult>(`/bookmarks/${id}/feed-preview`),
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
