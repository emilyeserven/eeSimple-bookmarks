import type {
  AdvancedSettings,
  DatabaseUsageReport,
  UpdateAdvancedSettingsInput,
  AutomationSettings,
  UpdateAutomationInput,
  DisplayPreferenceSettings,
  UpdateDisplayPreferenceInput,
  SidebarCustomizationSettings,
  UpdateSidebarCustomizationInput,
  AutofillPreviewInput,
  CreatePinnedSidebarItemInput,
  PinnedSidebarItem,
  CreateFavoriteSettingsPageInput,
  FavoriteSettingsPage,
  AutofillPreviewResult,
  AutofillRule,
  Bookmark,
  CreateCustomAspectRatioInput,
  CustomAspectRatio,
  CreateSavedFilterInput,
  SavedFilter,
  UpdateSavedFilterInput,
  BookmarkFileValue,
  BookmarkImage,
  BookmarkUrlDuplicateResult,
  BookmarkUrlSummary,
  BulkUrlUpdate,
  BulkUrlUpdateResult,
  Category,
  CategoryPropertyDefaults,
  CheckUrlResult,
  CardDisplayRule,
  CreateAutofillRuleInput,
  CreateBookmarkInput,
  CreateCardDisplayRuleInput,
  CreateCategoryInput,
  CreateCustomPropertyInput,
  CreateHomepageSectionInput,
  CreateMediaTypeInput,
  CreatePropertyGroupInput,
  CreateRelationshipTypeInput,
  CreateTagInput,
  CreateWebsiteInput,
  CustomProperty,
  DeleteOrphansResult,
  FetchMetadataResult,
  GalleryCatalog,
  GalleryScanResult,
  HomepageContentSettings,
  HomepageSection,
  HomepageSectionBookmarks,
  ActiveImport,
  BlockImportItemInput,
  Import,
  ImportApproveResult,
  ImportBlacklistEntry,
  ImportItem,
  ImportSummary,
  InboxItem,
  IngestPasteInput,
  IngestUrlInput,
  CreateNewsletterInput,
  Newsletter,
  UpdateNewsletterInput,
  MediaType,
  MediaTypeNode,
  OrphanCounts,
  OrphanDeleteResult,
  PropertyGroup,
  PurgeImportItemsResult,
  RejectPendingItemsResult,
  UpdateImportItemInput,
  RelationshipType,
  Tag,
  TagNode,
  UpdateAutofillRuleInput,
  UpdateCardDisplayRuleInput,
  UpdateBookmarkInput,
  UpdateBookmarkRelationshipsInput,
  UpdateCategoryDefaultsInput,
  UpdateCategoryInput,
  UpdateCustomPropertyInput,
  UpdateHomepageContentInput,
  UpdateHomepageSectionInput,
  UpdateMediaTypeInput,
  UpdatePropertyGroupInput,
  UpdateRelationshipTypeInput,
  UpdateTagInput,
  UpdateWebsiteInput,
  UpdateYouTubeChannelInput,
  CreateYouTubeChannelInput,
  Website,
  WebsiteLookup,
  YouTubeChannel,
} from "@eesimple/types";

import { ApiError } from "./apiError";

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(init?.body != null && {
        "Content-Type": "application/json",
      }),
    },
    ...init,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      message?: string;
      code?: string;
    };
    throw new ApiError(body.message ?? `Request failed with ${res.status}`, body.code);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// Image uploads go through FormData, not the JSON `request` helper, so the browser sets the
// multipart boundary itself. Shared by the bookmark, website-favicon, and channel-avatar uploads.
async function uploadImageFile<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new ApiError(body.message ?? `Upload failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

function createCrudApi<T, C, U>(endpoint: string) {
  return {
    list: () => request<T[]>(`/${endpoint}`),
    create: (input: C) =>
      request<T>(`/${endpoint}`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id: string, input: U) =>
      request<T>(`/${endpoint}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    remove: (id: string) =>
      request<undefined>(`/${endpoint}/${id}`, {
        method: "DELETE",
      }),
  };
}

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
  approveItem: (itemId: string) =>
    request<ImportApproveResult>(`/imports/items/${itemId}/approve`, {
      method: "POST",
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
  /** Delete every rejected candidate across all imports (the Inbox "delete all rejected" action). */
  deleteRejected: () =>
    request<PurgeImportItemsResult>("/imports/items/rejected", {
      method: "DELETE",
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
};

function buildSiteParams({
  url, siteName,
}: { url: string;
  siteName?: string; }): URLSearchParams {
  const params = new URLSearchParams({
    url,
  });
  if (siteName) params.set("siteName", siteName);
  return params;
}

export const metadataApi = {
  fetchTitle: ({
    url, siteName,
  }: { url: string;
    siteName?: string; }) =>
    request<{ title: string }>(`/fetch-title?${buildSiteParams({
      url,
      siteName,
    }).toString()}`),
  fetchMetadata: ({
    url, siteName,
  }: { url: string;
    siteName?: string; }) =>
    request<FetchMetadataResult>(`/fetch-metadata?${buildSiteParams({
      url,
      siteName,
    }).toString()}`),
  checkUrl: ({
    url,
  }: { url: string }) =>
    request<CheckUrlResult>(`/check-url?url=${encodeURIComponent(url)}`),
};

export const tagsApi = {
  ...createCrudApi<Tag, CreateTagInput, UpdateTagInput>("tags"),
  tree: () => request<TagNode[]>("/tags/tree"),
  categories: (id: string) =>
    request<{ categoryIds: string[] }>(`/tags/${id}/categories`),
  setCategories: (id: string, categoryIds: string[]) =>
    request<{ categoryIds: string[] }>(`/tags/${id}/categories`, {
      method: "PUT",
      body: JSON.stringify({
        categoryIds,
      }),
    }),
};

export const websitesApi = {
  ...createCrudApi<Website, CreateWebsiteInput, UpdateWebsiteInput>("websites"),
  lookup: (url: string) =>
    request<WebsiteLookup>(`/websites/lookup?url=${encodeURIComponent(url)}`),
  uploadImage: (id: string, file: File) =>
    uploadImageFile<{ imageUrl: string }>(`/websites/${id}/image`, file),
  autoImage: (id: string) =>
    request<{ imageUrl: string }>(`/websites/${id}/image/auto`, {
      method: "POST",
    }),
  deleteImage: (id: string) =>
    request<undefined>(`/websites/${id}/image`, {
      method: "DELETE",
    }),
};

export const appSettingsApi = {
  getShortenerIgnoreList: () => request<string[]>("/app-settings/shortener-ignore-list"),
  updateShortenerIgnoreList: (domains: string[]) =>
    request<string[]>("/app-settings/shortener-ignore-list", {
      method: "PUT",
      body: JSON.stringify({
        domains,
      }),
    }),
  getImportBlacklist: () =>
    request<ImportBlacklistEntry[]>("/app-settings/import-blacklist"),
  updateImportBlacklist: (entries: ImportBlacklistEntry[]) =>
    request<ImportBlacklistEntry[]>("/app-settings/import-blacklist", {
      method: "PUT",
      body: JSON.stringify({
        entries,
      }),
    }),
  getHomepageContent: () =>
    request<HomepageContentSettings>("/app-settings/homepage-content"),
  updateHomepageContent: (input: UpdateHomepageContentInput) =>
    request<HomepageContentSettings>("/app-settings/homepage-content", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getAdvanced: () => request<AdvancedSettings>("/app-settings/advanced"),
  updateAdvanced: (input: UpdateAdvancedSettingsInput) =>
    request<AdvancedSettings>("/app-settings/advanced", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getDatabaseUsage: () => request<DatabaseUsageReport>("/app-settings/database-usage"),
  getSidebarCustomization: () =>
    request<SidebarCustomizationSettings>("/app-settings/sidebar-customization"),
  updateSidebarCustomization: (input: UpdateSidebarCustomizationInput) =>
    request<SidebarCustomizationSettings>("/app-settings/sidebar-customization", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getAutomation: () => request<AutomationSettings>("/app-settings/automation"),
  updateAutomation: (input: UpdateAutomationInput) =>
    request<AutomationSettings>("/app-settings/automation", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getDisplayPreferences: () =>
    request<DisplayPreferenceSettings>("/app-settings/display-preferences"),
  updateDisplayPreferences: (input: UpdateDisplayPreferenceInput) =>
    request<DisplayPreferenceSettings>("/app-settings/display-preferences", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
};

export const mediaTypesApi = {
  ...createCrudApi<MediaType, CreateMediaTypeInput, UpdateMediaTypeInput>("media-types"),
  tree: () => request<MediaTypeNode[]>("/media-types/tree"),
};

export const propertyGroupsApi = createCrudApi<PropertyGroup, CreatePropertyGroupInput, UpdatePropertyGroupInput>("property-groups");

export const relationshipTypesApi = createCrudApi<RelationshipType, CreateRelationshipTypeInput, UpdateRelationshipTypeInput>("relationship-types");

export const youtubeChannelsApi = {
  list: () => request<YouTubeChannel[]>("/youtube-channels"),
  create: (input: CreateYouTubeChannelInput) =>
    request<YouTubeChannel>("/youtube-channels", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdateYouTubeChannelInput) =>
    request<YouTubeChannel>(`/youtube-channels/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/youtube-channels/${id}`, {
    method: "DELETE",
  }),
  uploadImage: (id: string, file: File) =>
    uploadImageFile<{ imageUrl: string }>(`/youtube-channels/${id}/image`, file),
  autoImage: (id: string) =>
    request<{ imageUrl: string }>(`/youtube-channels/${id}/image/auto`, {
      method: "POST",
    }),
  deleteImage: (id: string) =>
    request<undefined>(`/youtube-channels/${id}/image`, {
      method: "DELETE",
    }),
};

export const customPropertiesApi = createCrudApi<CustomProperty, CreateCustomPropertyInput, UpdateCustomPropertyInput>("custom-properties");

export const categoriesApi = {
  ...createCrudApi<Category, CreateCategoryInput, UpdateCategoryInput>("categories"),
  rootTags: (id: string) =>
    request<{ tagIds: string[] }>(`/categories/${id}/root-tags`),
  setRootTags: (id: string, tagIds: string[]) =>
    request<{ tagIds: string[] }>(`/categories/${id}/root-tags`, {
      method: "PUT",
      body: JSON.stringify({
        tagIds,
      }),
    }),
  defaults: (id: string) =>
    request<CategoryPropertyDefaults>(`/categories/${id}/defaults`),
  setDefaults: (id: string, input: UpdateCategoryDefaultsInput) =>
    request<CategoryPropertyDefaults>(`/categories/${id}/defaults`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
};

export const homepageSectionsApi = {
  ...createCrudApi<HomepageSection, CreateHomepageSectionInput, UpdateHomepageSectionInput>("homepage-sections"),
  reorder: (orderedIds: string[]) =>
    request<undefined>("/homepage-sections/reorder", {
      method: "PUT",
      body: JSON.stringify({
        orderedIds,
      }),
    }),
  withBookmarks: () => request<HomepageSectionBookmarks[]>("/bookmarks/homepage-sections"),
};

export const cardDisplayRulesApi = {
  ...createCrudApi<CardDisplayRule, CreateCardDisplayRuleInput, UpdateCardDisplayRuleInput>("card-display-rules"),
  reorder: (orderedIds: string[]) =>
    request<undefined>("/card-display-rules/reorder", {
      method: "PUT",
      body: JSON.stringify({
        orderedIds,
      }),
    }),
};

export const savedFiltersApi = createCrudApi<SavedFilter, CreateSavedFilterInput, UpdateSavedFilterInput>("saved-filters");

export const pinnedSidebarItemsApi = {
  list: () => request<PinnedSidebarItem[]>("/pinned-sidebar-items"),
  create: (input: CreatePinnedSidebarItemInput) =>
    request<PinnedSidebarItem>("/pinned-sidebar-items", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/pinned-sidebar-items/${id}`, {
    method: "DELETE",
  }),
};

export const favoriteSettingsPagesApi = {
  list: () => request<FavoriteSettingsPage[]>("/favorite-settings-pages"),
  create: (input: CreateFavoriteSettingsPageInput) =>
    request<FavoriteSettingsPage>("/favorite-settings-pages", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/favorite-settings-pages/${id}`, {
    method: "DELETE",
  }),
};

export const customAspectRatiosApi = {
  list: () => request<CustomAspectRatio[]>("/custom-aspect-ratios"),
  create: (input: CreateCustomAspectRatioInput) =>
    request<CustomAspectRatio>("/custom-aspect-ratios", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/custom-aspect-ratios/${id}`, {
    method: "DELETE",
  }),
};

export const autofillApi = {
  ...createCrudApi<AutofillRule, CreateAutofillRuleInput, UpdateAutofillRuleInput>("autofill-rules"),
  getBySlug: (slug: string) =>
    request<AutofillRule>(`/autofill-rules/by-slug/${encodeURIComponent(slug)}`),
  preview: (input: AutofillPreviewInput) =>
    request<AutofillPreviewResult>("/autofill-rules/preview", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
