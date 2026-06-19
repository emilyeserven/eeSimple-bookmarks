import type {
  AutofillRule,
  Bookmark,
  CreateDisplayPresetInput,
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
  Website,
  WebsiteLookup,
  YouTubeChannel,
} from "@eesimple/types";

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
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Request failed with ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const bookmarksApi = {
  list: (tagId?: string) =>
    request<Bookmark[]>(`/bookmarks${tagId ? `?tag=${encodeURIComponent(tagId)}` : ""}`),
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
  // Image upload goes through FormData, not the JSON `request` helper, so the browser sets the
  // multipart boundary itself.
  uploadImage: async (id: string, file: File): Promise<BookmarkImage> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE}/bookmarks/${id}/image`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(body.message ?? `Upload failed with ${res.status}`);
    }
    return (await res.json()) as BookmarkImage;
  },
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

export const metadataApi = {
  fetchTitle: ({
    url, siteName,
  }: { url: string;
    siteName?: string; }) => {
    const params = new URLSearchParams({
      url,
    });
    if (siteName) params.set("siteName", siteName);
    return request<{ title: string }>(`/fetch-title?${params.toString()}`);
  },
  fetchMetadata: ({
    url, siteName,
  }: { url: string;
    siteName?: string; }) => {
    const params = new URLSearchParams({
      url,
    });
    if (siteName) params.set("siteName", siteName);
    return request<FetchMetadataResult>(`/fetch-metadata?${params.toString()}`);
  },
  checkUrl: ({
    url,
  }: { url: string }) =>
    request<CheckUrlResult>(`/check-url?url=${encodeURIComponent(url)}`),
};

export const tagsApi = {
  list: () => request<Tag[]>("/tags"),
  tree: () => request<TagNode[]>("/tags/tree"),
  create: (input: CreateTagInput) =>
    request<Tag>("/tags", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdateTagInput) =>
    request<Tag>(`/tags/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/tags/${id}`, {
    method: "DELETE",
  }),
};

export const websitesApi = {
  list: () => request<Website[]>("/websites"),
  create: (input: CreateWebsiteInput) =>
    request<Website>("/websites", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  lookup: (url: string) =>
    request<WebsiteLookup>(`/websites/lookup?url=${encodeURIComponent(url)}`),
  update: (id: string, input: UpdateWebsiteInput) =>
    request<Website>(`/websites/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/websites/${id}`, {
    method: "DELETE",
  }),
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
  list: () => request<MediaType[]>("/media-types"),
  create: (input: CreateMediaTypeInput) =>
    request<MediaType>("/media-types", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdateMediaTypeInput) =>
    request<MediaType>(`/media-types/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/media-types/${id}`, {
    method: "DELETE",
  }),
};

export const propertyGroupsApi = {
  list: () => request<PropertyGroup[]>("/property-groups"),
  create: (input: CreatePropertyGroupInput) =>
    request<PropertyGroup>("/property-groups", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdatePropertyGroupInput) =>
    request<PropertyGroup>(`/property-groups/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/property-groups/${id}`, {
    method: "DELETE",
  }),
};

export const youtubeChannelsApi = {
  list: () => request<YouTubeChannel[]>("/youtube-channels"),
  update: (id: string, input: UpdateYouTubeChannelInput) =>
    request<YouTubeChannel>(`/youtube-channels/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/youtube-channels/${id}`, {
    method: "DELETE",
  }),
  autoImage: (id: string) =>
    request<{ imageUrl: string }>(`/youtube-channels/${id}/image/auto`, {
      method: "POST",
    }),
  deleteImage: (id: string) =>
    request<undefined>(`/youtube-channels/${id}/image`, {
      method: "DELETE",
    }),
};

export const customPropertiesApi = {
  list: () => request<CustomProperty[]>("/custom-properties"),
  create: (input: CreateCustomPropertyInput) =>
    request<CustomProperty>("/custom-properties", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdateCustomPropertyInput) =>
    request<CustomProperty>(`/custom-properties/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/custom-properties/${id}`, {
    method: "DELETE",
  }),
};

export const categoriesApi = {
  list: () => request<Category[]>("/categories"),
  create: (input: CreateCategoryInput) =>
    request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdateCategoryInput) =>
    request<Category>(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/categories/${id}`, {
    method: "DELETE",
  }),
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
  list: () => request<HomepageSection[]>("/homepage-sections"),
  create: (input: CreateHomepageSectionInput) =>
    request<HomepageSection>("/homepage-sections", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdateHomepageSectionInput) =>
    request<HomepageSection>(`/homepage-sections/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    request<undefined>(`/homepage-sections/${id}`, {
      method: "DELETE",
    }),
  reorder: (orderedIds: string[]) =>
    request<undefined>("/homepage-sections/reorder", {
      method: "PUT",
      body: JSON.stringify({
        orderedIds,
      }),
    }),
  withBookmarks: () => request<HomepageSectionBookmarks[]>("/bookmarks/homepage-sections"),
};

export const savedFiltersApi = {
  list: () => request<SavedFilter[]>("/saved-filters"),
  create: (input: CreateSavedFilterInput) =>
    request<SavedFilter>("/saved-filters", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdateSavedFilterInput) =>
    request<SavedFilter>(`/saved-filters/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/saved-filters/${id}`, {
    method: "DELETE",
  }),
};

export const displayPresetsApi = {
  list: () => request<DisplayPreset[]>("/display-presets"),
  create: (input: CreateDisplayPresetInput) =>
    request<DisplayPreset>("/display-presets", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdateDisplayPresetInput) =>
    request<DisplayPreset>(`/display-presets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/display-presets/${id}`, {
    method: "DELETE",
  }),
};

export const autofillApi = {
  list: () => request<AutofillRule[]>("/autofill-rules"),
  getBySlug: (slug: string) => request<AutofillRule>(`/autofill-rules/by-slug/${encodeURIComponent(slug)}`),
  create: (input: CreateAutofillRuleInput) =>
    request<AutofillRule>("/autofill-rules", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdateAutofillRuleInput) =>
    request<AutofillRule>(`/autofill-rules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => request<undefined>(`/autofill-rules/${id}`, {
    method: "DELETE",
  }),
};
