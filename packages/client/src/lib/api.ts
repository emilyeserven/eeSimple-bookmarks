import type {
  AutofillRule,
  Bookmark,
  Category,
  CategoryPropertyDefaults,
  CreateAutofillRuleInput,
  CreateBookmarkInput,
  CreateCategoryInput,
  CreateCustomPropertyInput,
  CreateTagInput,
  CustomProperty,
  Tag,
  TagNode,
  UpdateAutofillRuleInput,
  UpdateBookmarkInput,
  UpdateCategoryDefaultsInput,
  UpdateCategoryInput,
  UpdateCustomPropertyInput,
  UpdateTagInput,
  UpdateWebsiteInput,
  Website,
  WebsiteLookup,
} from "@eesimple/types";

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
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
  homepage: () => request<Bookmark[]>("/bookmarks/homepage"),
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
};

export const metadataApi = {
  fetchTitle: (url: string) =>
    request<{ title: string }>(`/fetch-title?url=${encodeURIComponent(url)}`),
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
  homepageTags: () => request<{ tagIds: string[] }>("/homepage-tags"),
  setHomepageTags: (tagIds: string[]) =>
    request<{ tagIds: string[] }>("/homepage-tags", {
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

export const autofillApi = {
  list: () => request<AutofillRule[]>("/autofill-rules"),
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
