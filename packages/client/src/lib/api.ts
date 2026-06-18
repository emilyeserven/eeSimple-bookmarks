import type {
  AutofillRule,
  Bookmark,
  BookmarkImage,
  Category,
  CategoryPropertyDefaults,
  CreateAutofillRuleInput,
  CreateBookmarkInput,
  CreateCategoryInput,
  CreateCustomPropertyInput,
  CreateHomepageSectionInput,
  CreateMediaTypeInput,
  CreateTagInput,
  CreateWebsiteInput,
  CustomProperty,
  DeleteOrphansResult,
  FetchMetadataResult,
  GalleryCatalog,
  GalleryScanResult,
  HomepageSection,
  HomepageSectionBookmarks,
  MediaType,
  Tag,
  TagNode,
  UpdateAutofillRuleInput,
  UpdateBookmarkInput,
  UpdateCategoryDefaultsInput,
  UpdateCategoryInput,
  UpdateCustomPropertyInput,
  UpdateHomepageSectionInput,
  UpdateMediaTypeInput,
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
