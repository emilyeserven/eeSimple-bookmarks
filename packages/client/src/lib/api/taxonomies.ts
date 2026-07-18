import type {
  Person,
  AutoFetchJobStatus,
  BulkBookmarkResult,
  BulkDeleteResult,
  Category,
  CategoryPropertyDefaults,
  CreatePersonInput,
  SocialLink,
  CreateCategoryInput,
  CreateCustomPropertyInput,
  CreateMediaTypeInput,
  CreateLanguageInput,
  CreateLanguageUsageLevelInput,
  UpdateLanguageUsageLevelInput,
  LanguageUsageLevel,
  LanguageUsageKind,
  LanguageUsage,
  LanguageUsageAssociation,
  LanguageUsageOwnerType,
  UpdateLanguageUsageEntry,
  TranslationSource,
  CreateTranslationSourceInput,
  UpdateTranslationSourceInput,
  EntityName,
  EntityNameOwnerType,
  UpdateEntityNameEntry,
  CreatePlaceTypeInput,
  CreateLocationRelationInput,
  UpdateLocationRelationInput,
  LocationRelation,
  CreateGroupInput,
  CreateGroupTypeInput,
  CreateRelationshipTypeInput,
  CreateTagInput,
  CreateWebsiteInput,
  CreateYouTubeChannelInput,
  CreateLocationChainInput,
  CreateLocationInput,
  SetLocationAncestorsInput,
  CustomProperty,
  CreateGenreMoodInput,
  UpdateGenreMoodInput,
  GenreMood,
  GenreMoodNode,
  GenreMoodOwnerType,
  BookmarkGenreMood,
  Taxonomy,
  TaxonomyTerm,
  TaxonomyTermNode,
  BookmarkTaxonomyTerm,
  TaxonomyOwnerType,
  CreateTaxonomyInput,
  UpdateTaxonomyInput,
  CreateTaxonomyTermInput,
  UpdateTaxonomyTermInput,
  Location,
  LocationLookupResult,
  LocationNode,
  Language,
  MediaType,
  MediaTypeNode,
  PlaceType,
  UpdateLocationInput,
  UpdatePlaceTypeInput,
  Group,
  GroupType,
  RedirectFailureWebsite,
  RelationshipType,
  SocialMediaPlatform,
  Tag,
  TagNode,
  TagReparentPlanInput,
  TagReparentResult,
  UpdatePersonInput,
  UpdateCategoryDefaultsInput,
  UpdateCategoryInput,
  UpdateCustomPropertyInput,
  UpdateMediaTypeInput,
  UpdateLanguageInput,
  UpdateGroupInput,
  UpdateGroupTypeInput,
  UpdateRelationshipTypeInput,
  UpdateTagInput,
  UpdateWebsiteInput,
  UpdateYouTubeChannelInput,
  Website,
  WebsiteLookup,
  WebsiteNode,
  YouTubeChannel,
} from "@eesimple/types";

import { createCrudApi, request, uploadImageFile } from "./client";

export const peopleApi = {
  ...createCrudApi<Person, CreatePersonInput, UpdatePersonInput>("people"),
  uploadImage: (id: string, file: File) =>
    uploadImageFile<{ imageUrl: string }>(`/people/${id}/image`, file),
  autoImage: (id: string, source: "website" | "biography" | "social", platform?: SocialMediaPlatform) =>
    request<{ imageUrl: string }>(`/people/${id}/image/auto`, {
      method: "POST",
      body: JSON.stringify({
        source,
        ...(platform
          ? {
            platform,
          }
          : {}),
      }),
    }),
  deleteImage: (id: string) =>
    request<undefined>(`/people/${id}/image`, {
      method: "DELETE",
    }),
  adoptChannelImage: (id: string, channelId: string) =>
    request<{ imageUrl: string }>(`/people/${id}/image/from-channel`, {
      method: "POST",
      body: JSON.stringify({
        channelId,
      }),
    }),
  adoptWebsiteFavicon: (id: string, websiteId: string) =>
    request<{ imageUrl: string }>(`/people/${id}/image/from-website`, {
      method: "POST",
      body: JSON.stringify({
        websiteId,
      }),
    }),
  detectSocialLinks: (id: string) =>
    request<{ detected: SocialLink[] }>(`/people/${id}/social-links/detect`, {
      method: "POST",
    }),
};

export const tagsApi = {
  ...createCrudApi<Tag, CreateTagInput, UpdateTagInput>("tags"),
  tree: () => request<TagNode[]>("/tags/tree"),
  bulkReparent: (ids: string[], parentId: string | null) =>
    request<BulkBookmarkResult[]>("/tags/bulk-reparent", {
      method: "POST",
      body: JSON.stringify({
        ids,
        parentId,
      }),
    }),
  reparentPlan: (input: TagReparentPlanInput) =>
    request<TagReparentResult>("/tags/reparent-plan", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

export const websitesApi = {
  ...createCrudApi<Website, CreateWebsiteInput, UpdateWebsiteInput>("websites"),
  lookup: (url: string) =>
    request<WebsiteLookup>(`/websites/lookup?url=${encodeURIComponent(url)}`),
  redirectFailures: () =>
    request<RedirectFailureWebsite[]>("/websites/redirect-failures"),
  tree: () => request<WebsiteNode[]>("/websites/tree"),
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
  bulkUpdate: (ids: string[], patch: UpdateWebsiteInput) =>
    request<BulkBookmarkResult[]>("/websites/bulk", {
      method: "POST",
      body: JSON.stringify({
        ids,
        patch,
      }),
    }),
  bulkTags: (ids: string[], tagIds: string[], op: "add" | "remove") =>
    request<BulkBookmarkResult[]>("/websites/bulk-tags", {
      method: "POST",
      body: JSON.stringify({
        ids,
        tagIds,
        op,
      }),
    }),
};

export const mediaTypesApi = {
  ...createCrudApi<MediaType, CreateMediaTypeInput, UpdateMediaTypeInput>("media-types"),
  tree: () => request<MediaTypeNode[]>("/media-types/tree"),
};

export const genreMoodsApi = {
  ...createCrudApi<GenreMood, CreateGenreMoodInput, UpdateGenreMoodInput>("genre-moods"),
  tree: () => request<GenreMoodNode[]>("/genre-moods/tree"),
};

export const genreMoodAssignmentsApi = {
  list: (ownerType: GenreMoodOwnerType, ownerId: string) =>
    request<BookmarkGenreMood[]>(`/genre-mood-assignments/${ownerType}/${ownerId}`),
  listByOwnerType: (ownerType: GenreMoodOwnerType) =>
    request<Record<string, string[]>>(`/genre-mood-assignments/by-owner-type/${ownerType}`),
  set: (ownerType: GenreMoodOwnerType, ownerId: string, genreMoodIds: string[]) =>
    request<BookmarkGenreMood[]>(`/genre-mood-assignments/${ownerType}/${ownerId}`, {
      method: "PUT",
      body: JSON.stringify({
        genreMoodIds,
      }),
    }),
};

export const taxonomiesApi = {
  ...createCrudApi<Taxonomy, CreateTaxonomyInput, UpdateTaxonomyInput>("taxonomies"),
  bySlug: (slug: string) => request<Taxonomy>(`/taxonomies/by-slug/${slug}`),
  promoteTag: (tagId: string) =>
    request<Taxonomy>("/taxonomies/promote-tag", {
      method: "POST",
      body: JSON.stringify({
        tagId,
      }),
    }),
  demote: (id: string, parentTagId?: string | null) =>
    request<{ parentTagId: string }>(`/taxonomies/${id}/demote`, {
      method: "POST",
      body: JSON.stringify({
        parentTagId: parentTagId ?? null,
      }),
    }),
  // Terms — nested for list/tree/create, flat by id for update/remove/bulk.
  listTerms: (taxonomyId: string) => request<TaxonomyTerm[]>(`/taxonomies/${taxonomyId}/terms`),
  /** Every starred term across all taxonomies (for the per-taxonomy sidebar flyouts + Genres & Moods). */
  favoriteTerms: () => request<TaxonomyTerm[]>("/taxonomy-terms/favorites"),
  termTree: (taxonomyId: string) => request<TaxonomyTermNode[]>(`/taxonomies/${taxonomyId}/terms/tree`),
  createTerm: (taxonomyId: string, input: CreateTaxonomyTermInput) =>
    request<TaxonomyTerm>(`/taxonomies/${taxonomyId}/terms`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateTerm: (id: string, input: UpdateTaxonomyTermInput) =>
    request<TaxonomyTerm>(`/taxonomy-terms/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  removeTerm: (id: string) =>
    request<undefined>(`/taxonomy-terms/${id}`, {
      method: "DELETE",
    }),
  bulkDeleteTerms: (ids: string[]) =>
    request<BulkDeleteResult[]>("/taxonomy-terms/bulk-delete", {
      method: "POST",
      body: JSON.stringify({
        ids,
      }),
    }),
};

export const taxonomyAssignmentsApi = {
  list: (ownerType: TaxonomyOwnerType, ownerId: string) =>
    request<BookmarkTaxonomyTerm[]>(`/taxonomy-assignments/${ownerType}/${ownerId}`),
  listByOwnerType: (taxonomyId: string, ownerType: TaxonomyOwnerType) =>
    request<Record<string, string[]>>(`/taxonomy-assignments/by-owner-type/${taxonomyId}/${ownerType}`),
  set: (taxonomyId: string, ownerType: TaxonomyOwnerType, ownerId: string, termIds: string[]) =>
    request<BookmarkTaxonomyTerm[]>(`/taxonomy-assignments/${ownerType}/${ownerId}`, {
      method: "PUT",
      body: JSON.stringify({
        taxonomyId,
        termIds,
      }),
    }),
};

export const languagesApi = createCrudApi<Language, CreateLanguageInput, UpdateLanguageInput>("languages");

export const locationsApi = {
  ...createCrudApi<Location, CreateLocationInput, UpdateLocationInput>("locations"),
  tree: () => request<LocationNode[]>("/locations/tree"),
  lookup: (query: string, source?: "wikidata") =>
    request<LocationLookupResult>(
      `/locations/lookup?q=${encodeURIComponent(query)}${source ? `&source=${source}` : ""}`,
    ),
  createChain: (input: CreateLocationChainInput) =>
    request<Location>("/locations/chain", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  setAncestors: (id: string, input: SetLocationAncestorsInput) =>
    request<Location>(`/locations/${id}/ancestors`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  refreshBoundary: (id: string) =>
    request<Location>(`/locations/${id}/refresh-boundary`, {
      method: "POST",
    }),
  refreshCoordinates: (id: string) =>
    request<Location>(`/locations/${id}/refresh-coordinates`, {
      method: "POST",
    }),
  autofillWikipediaLinks: (id: string) =>
    request<Location>(`/locations/${id}/autofill-wikipedia-links`, {
      method: "POST",
    }),
};

export const placeTypesApi = {
  ...createCrudApi<PlaceType, CreatePlaceTypeInput, UpdatePlaceTypeInput>("place-types"),
  // Override the generic remove so deletion can optionally reassign the place type's locations to
  // another place type (via the `reassignTo` query param) instead of orphaning them.
  remove: (id: string, reassignTo?: string) =>
    request<undefined>(
      `/place-types/${id}${reassignTo ? `?reassignTo=${encodeURIComponent(reassignTo)}` : ""}`,
      {
        method: "DELETE",
      },
    ),
};

export const locationRelationsApi = {
  ...createCrudApi<LocationRelation, CreateLocationRelationInput, UpdateLocationRelationInput>("location-relations"),
  // Override the generic remove so deletion can optionally reassign the relation's bookmark-location
  // edges to another relation (via the `reassignTo` query param) instead of clearing them.
  remove: (id: string, reassignTo?: string) =>
    request<undefined>(
      `/location-relations/${id}${reassignTo ? `?reassignTo=${encodeURIComponent(reassignTo)}` : ""}`,
      {
        method: "DELETE",
      },
    ),
};

export const languageUsageLevelsApi = {
  ...createCrudApi<LanguageUsageLevel, CreateLanguageUsageLevelInput, UpdateLanguageUsageLevelInput>("language-usage-levels"),
  // Optionally filter to a single kind (availability vs. proficiency) for the pickers.
  list: (kind?: LanguageUsageKind) =>
    request<LanguageUsageLevel[]>(`/language-usage-levels${kind ? `?kind=${kind}` : ""}`),
  // Distinct (language, level) pairings across all owners, with counts, for the overview page.
  associations: () =>
    request<LanguageUsageAssociation[]>("/language-usage-levels/associations"),
  // Deleting a level can reassign its associations to another level instead of dropping them.
  remove: (id: string, reassignTo?: string) =>
    request<undefined>(
      `/language-usage-levels/${id}${reassignTo ? `?reassignTo=${encodeURIComponent(reassignTo)}` : ""}`,
      {
        method: "DELETE",
      },
    ),
};

export const languageUsagesApi = {
  get: (ownerType: LanguageUsageOwnerType, ownerId: string) =>
    request<LanguageUsage[]>(`/language-usages/${ownerType}/${ownerId}`),
  listByOwnerType: (ownerType: LanguageUsageOwnerType) =>
    request<Record<string, { languageId: string;
      usageLevelId: string; }[]>>(`/language-usages/by-owner-type/${ownerType}`),
  put: (ownerType: LanguageUsageOwnerType, ownerId: string, entries: UpdateLanguageUsageEntry[]) =>
    request<LanguageUsage[]>(`/language-usages/${ownerType}/${ownerId}`, {
      method: "PUT",
      body: JSON.stringify({
        entries,
      }),
    }),
};

export const translationSourcesApi = {
  ...createCrudApi<TranslationSource, CreateTranslationSourceInput, UpdateTranslationSourceInput>("translation-sources"),
  // Deleting a source can reassign its associations to another source instead of clearing them.
  remove: (id: string, reassignTo?: string) =>
    request<undefined>(
      `/translation-sources/${id}${reassignTo ? `?reassignTo=${encodeURIComponent(reassignTo)}` : ""}`,
      {
        method: "DELETE",
      },
    ),
};

export const entityNamesApi = {
  get: (ownerType: EntityNameOwnerType, ownerId: string) =>
    request<EntityName[]>(`/entity-names/${ownerType}/${ownerId}`),
  put: (ownerType: EntityNameOwnerType, ownerId: string, entries: UpdateEntityNameEntry[]) =>
    request<EntityName[]>(`/entity-names/${ownerType}/${ownerId}`, {
      method: "PUT",
      body: JSON.stringify({
        entries,
      }),
    }),
};

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
  backfillImages: () =>
    request<AutoFetchJobStatus>("/youtube-channels/backfill-images", {
      method: "POST",
    }),
  backfillImagesStatus: () => request<AutoFetchJobStatus>("/youtube-channels/backfill-images/status"),
  missingImageCount: () => request<{ count: number }>("/youtube-channels/missing-image-count"),
};

export const customPropertiesApi = createCrudApi<CustomProperty, CreateCustomPropertyInput, UpdateCustomPropertyInput>("custom-properties");

export const groupsApi = {
  ...createCrudApi<Group, CreateGroupInput, UpdateGroupInput>("groups"),
  uploadImage: (id: string, file: File) =>
    uploadImageFile<{ imageUrl: string }>(`/groups/${id}/image`, file),
  autoImage: (id: string, source: "website" | "plex") =>
    request<{ imageUrl: string }>(`/groups/${id}/image/auto`, {
      method: "POST",
      body: JSON.stringify({
        source,
      }),
    }),
  deleteImage: (id: string) =>
    request<undefined>(`/groups/${id}/image`, {
      method: "DELETE",
    }),
};

export const groupTypesApi = createCrudApi<GroupType, CreateGroupTypeInput, UpdateGroupTypeInput>("group-types");

export const categoriesApi = {
  ...createCrudApi<Category, CreateCategoryInput, UpdateCategoryInput>("categories"),
  defaults: (id: string) =>
    request<CategoryPropertyDefaults>(`/categories/${id}/defaults`),
  setDefaults: (id: string, input: UpdateCategoryDefaultsInput) =>
    request<CategoryPropertyDefaults>(`/categories/${id}/defaults`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
};
