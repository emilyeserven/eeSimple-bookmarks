import type {
  Author,
  BulkDeleteResult,
  Category,
  CategoryPropertyDefaults,
  CreateAuthorInput,
  CreateCategoryInput,
  CreateCustomPropertyInput,
  CreateMediaTypeInput,
  CreatePropertyGroupInput,
  CreatePublisherInput,
  CreateRelationshipTypeInput,
  CreateTagInput,
  CreateWebsiteInput,
  CreateYouTubeChannelInput,
  CustomProperty,
  MediaType,
  MediaTypeNode,
  PropertyGroup,
  Publisher,
  RedirectFailureWebsite,
  RelationshipType,
  Tag,
  TagNode,
  UpdateAuthorInput,
  UpdateCategoryDefaultsInput,
  UpdateCategoryInput,
  UpdateCustomPropertyInput,
  UpdateMediaTypeInput,
  UpdatePropertyGroupInput,
  UpdatePublisherInput,
  UpdateRelationshipTypeInput,
  UpdateTagInput,
  UpdateWebsiteInput,
  UpdateYouTubeChannelInput,
  Website,
  WebsiteLookup,
  YouTubeChannel,
} from "@eesimple/types";

import { createCrudApi, request, uploadImageFile } from "./client";

export const authorsApi = {
  ...createCrudApi<Author, CreateAuthorInput, UpdateAuthorInput>("authors"),
  uploadImage: (id: string, file: File) =>
    uploadImageFile<{ imageUrl: string }>(`/authors/${id}/image`, file),
  autoImage: (id: string, source: "website" | "biography") =>
    request<{ imageUrl: string }>(`/authors/${id}/image/auto`, {
      method: "POST",
      body: JSON.stringify({
        source,
      }),
    }),
  deleteImage: (id: string) =>
    request<undefined>(`/authors/${id}/image`, {
      method: "DELETE",
    }),
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
  redirectFailures: () =>
    request<RedirectFailureWebsite[]>("/websites/redirect-failures"),
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
  bulkDelete: (ids: string[]) =>
    request<BulkDeleteResult[]>("/youtube-channels/bulk-delete", {
      method: "POST",
      body: JSON.stringify({
        ids,
      }),
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

export const publishersApi = createCrudApi<Publisher, CreatePublisherInput, UpdatePublisherInput>("publishers");

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
