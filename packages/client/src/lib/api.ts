import type {
  AutofillRule,
  Bookmark,
  CreateCustomAspectRatioInput,
  CreateDisplayPresetInput,
  CustomAspectRatio,
  DisplayPreset,
  UpdateDisplayPresetInput,
  CreateSavedFilterInput,
  SavedFilter,
  UpdateSavedFilterInput,
  BookmarkImage,
  BookmarkUrlDuplicateResult,
  BookmarkUrlSummary,
  BulkUrlUpdate,
  BulkUrlUpdateResult,
  Category,
  CategoryPropertyDefaults,
  CheckUrlResult,
  CreateAutofillRuleInput,
  CreateBookmarkInput,
  CreateCategoryInput,
  CreateCustomPropertyInput,
  CreateHomepageSectionInput,
  CreateMediaTypeInput,
  CreatePropertyGroupInput,
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
  MediaType,
  MediaTypeNode,
  PropertyGroup,
  Tag,
  TagNode,
  UpdateAutofillRuleInput,
  UpdateBookmarkInput,
  UpdateBookmarkRelationshipsInput,
  UpdateCategoryDefaultsInput,
  UpdateCategoryInput,
  UpdateCustomPropertyInput,
  UpdateHomepageContentInput,
  UpdateHomepageSectionInput,
  UpdateMediaTypeInput,
  UpdatePropertyGroupInput,
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
  updateRelationships: (id: string, input: UpdateBookmarkRelationshipsInput) =>
    request<Bookmark>(`/bookmarks/${id}/relationships`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
};

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
  getHomepageContent: () =>
    request<HomepageContentSettings>("/app-settings/homepage-content"),
  updateHomepageContent: (input: UpdateHomepageContentInput) =>
    request<HomepageContentSettings>("/app-settings/homepage-content", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
};

export const mediaTypesApi = {
  ...createCrudApi<MediaType, CreateMediaTypeInput, UpdateMediaTypeInput>("media-types"),
  tree: () => request<MediaTypeNode[]>("/media-types/tree"),
};

export const propertyGroupsApi = createCrudApi<PropertyGroup, CreatePropertyGroupInput, UpdatePropertyGroupInput>("property-groups");

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

export const savedFiltersApi = createCrudApi<SavedFilter, CreateSavedFilterInput, UpdateSavedFilterInput>("saved-filters");

export const displayPresetsApi = createCrudApi<DisplayPreset, CreateDisplayPresetInput, UpdateDisplayPresetInput>("display-presets");

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
};
